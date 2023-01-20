"use strict";

const { pluginId } = require("../utils/index");

module.exports = ({ strapi }) => ({
  async migrate(ctx) {
    const response = await strapi
      .plugin(pluginId)
      .service("migrateService")
      .migrate(ctx);

    if (response.result === "fail") {
      return ctx.badRequest("Invalid Credentials", {
        error: response.errorMessage,
      });
    }

    return response;
  },

  getConfig() {
    const response = strapi
      .plugin(pluginId)
      .service("migrateService")
      .getConfig();
    return response;
  },
});
