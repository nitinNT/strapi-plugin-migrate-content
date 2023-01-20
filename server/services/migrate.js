"use strict";

const { isArray, isObject } = require("lodash");
const axios = require("axios");
const { pluginId } = require("../utils");

module.exports = ({ strapi }) => ({
  async migrate(ctx) {
    const requestBody = ctx.request.body;

    const currentBearerToken = ctx.headers.authorization.split("Bearer")[1];

    const currentServerHost = ctx.headers["host"];

    const loginApi = requestBody.url + "/admin/login";

    const { data } = await axios.post(loginApi, {
      email: requestBody.email,
      password: requestBody.password,
    });

    const contentBody = await this.traverse(
      requestBody.contentBody,
      requestBody.url,
      currentServerHost,
      currentBearerToken,
      data.data.token,
      requestBody.uid
    );

    delete contentBody["id"];

    await this.saveData(
      requestBody.url,
      data.data.token,
      requestBody.uid,
      contentBody
    );

    return {
      result: "success",
      data: {
        token: data.data.token,
      },
    };
  },

  async saveData(url, bearerToken, collectionName, contentBody) {
    const requestBody = contentBody;

    const response = await axios.post(
      `${url}/content-manager/collection-types/${collectionName}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    await axios.post(
      `${url}/content-manager/collection-types/${collectionName}/${response.data.id}/actions/publish`,
      response.data,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    return response.data.id;
  },
  removeIdsFromJSON(obj) {
    const isArrayF = isArray(obj);
    for (const k of Object.keys(obj)) {
      if (k === "id" || obj[k] === null) delete obj[k];

      if (typeof obj[k] === "object") {
        this.removeIdsFromJSON(obj[k]);
      } else if (isArrayF && obj.length === k) {
        this.removeIdsFromJSON(obj);
      }
    }
    return obj;
  },

  async getDataFromRelationApi(host, relationName, id, bearerToken) {
    const response = await axios.get(
      `http://${host}/content-manager/collection-types/${relationName}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    return response.data;
  },
  async postDataToRelationApi(
    contentBody,
    url,
    currentServerHost,
    currentBearerToken,
    bearerToken,
    relationName
  ) {
    let body = await this.getDataFromRelationApi(
      currentServerHost,
      relationName,
      contentBody["id"],
      currentBearerToken
    );

    body = await this.traverse(
      body,
      url,
      currentServerHost,
      currentBearerToken,
      bearerToken,
      relationName
    );

    return await this.saveData(url, bearerToken, relationName, body);
  },

  getAttributes(uid) {
    return strapi.getModel(uid)["attributes"];
  },
  async traverse(
    contentBody,
    url,
    currentServerHost,
    currentBearerToken,
    bearerToken,
    uid
  ) {
    const keys = Object.keys(contentBody);

    const attributes = this.getAttributes(uid);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (key == "createdBy" || key == "updatedBy" || key == "versions") {
        continue;
      }
      if (isArray(contentBody[key])) {
        for (let j = 0; j < contentBody[key].length; j++) {
          if (attributes[key]["type"] === "relation") {
            contentBody[key][j] = await this.postDataToRelationApi(
              contentBody[key][j],
              url,
              currentServerHost,
              currentBearerToken,
              bearerToken,
              attributes[key]["target"]
            );
          } else if (attributes[key]["type"] === "dynamiczone") {
            delete contentBody[key][j]["id"];
            contentBody[key][j] = await this.traverse(
              contentBody[key][j],
              url,
              currentServerHost,
              currentBearerToken,
              bearerToken,
              contentBody[key][j]["__component"]
            );
          } else if (attributes[key]["type"] === "component") {
            delete contentBody[key][j]["id"];
            contentBody[key][j] = await this.traverse(
              contentBody[key][j],
              url,
              currentServerHost,
              currentBearerToken,
              bearerToken,
              attributes[key]["component"]
            );
          }
        }
      } else if (isObject(contentBody[key]) && attributes[key] != undefined) {
        // check for relation
        if (attributes[key]["type"] === "relation") {
          contentBody[key] = await this.postDataToRelationApi(
            contentBody[key],
            url,
            currentServerHost,
            currentBearerToken,
            bearerToken,
            attributes[key]["target"]
          );
        } else if (attributes[key]["type"] === "component") {
          delete contentBody[key]["id"];
          await this.traverse(
            contentBody[key],
            url,
            currentServerHost,
            currentBearerToken,
            bearerToken,
            attributes[key]["component"]
          );
        }
      }
    }
    return contentBody;
  },

  getConfig() {
    return strapi.config.get(`plugin.${pluginId}`);
  },
});
