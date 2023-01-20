import React, { useState, useEffect } from "react";

import {
  ModalLayout,
  ModalHeader,
  ModalBody,
} from "@strapi/design-system/ModalLayout";
import { request } from "@strapi/helper-plugin";

import { Box } from "@strapi/design-system/Box";
import { Typography } from "@strapi/design-system/Typography";
import { Divider } from "@strapi/design-system/Divider";
import { TextInput } from "@strapi/design-system/TextInput";
import { Button } from "@strapi/design-system/Button";
import { Combobox, ComboboxOption, Loader } from "@strapi/design-system";
import MigrateLoaderModal from "../MigrateLoaderModal";

import pluginDetails from "../../utils/plugin";

const pluginName = pluginDetails.pluginName;
const MigratePreview = ({ modifiedData, collectionName, setIsVisible }) => {
  const [loadModal, setLoadModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorDetails, setErrorDetails] = useState("");
  const [envUrls, setEnvUrls] = useState({});
  const [envURL, setEnvURL] = useState("");

  const [showLoader, setShowLoader] = useState(false);

  const migrateData = async () => {
    setLoadModal(true);
    try {
      setShowLoader(true);

      await request(`/${pluginName}/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: {
          url: envURL,
          email,
          password,
          uid: collectionName,
          contentBody: modifiedData,
        },
      });

      setLoadModal(false);
    } catch (err) {
      setShowLoader(false);
      setErrorDetails(err);
    }
  };

  useEffect(async () => {
    try {
      const response = await request(`/${pluginName}/config`, {
        method: "GET",
        headers: { "content-type": "application/json" },
      });
      setEnvUrls(response["environmentUrls"]);
    } catch (err) {
      console.log("failed ");
    }
  }, []);
  return (
    <ModalLayout onClose={() => setIsVisible((prev) => !prev)}>
      <ModalHeader>Content Migrate Plugin</ModalHeader>
      <ModalBody>
        <Box>
          <Typography variant="beta">
            Destination Strapi CMS Envrionment Details
          </Typography>
          <Box paddingTop={4}>
            <Divider />
          </Box>
        </Box>

        <Box>
          <Combobox label="Environment" value={envURL} onChange={setEnvURL}>
            {Object.keys(envUrls).map((e) => (
              <ComboboxOption value={envUrls[e]}>{e}</ComboboxOption>
            ))}
          </Combobox>

          <TextInput
            placeholder="nitin.tejuja12@gmail.com"
            label="Email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
          <TextInput
            placeholder="password"
            label="Password"
            type="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          <Button onClick={migrateData}>Migrate</Button>
          {loadModal && (
            <MigrateLoaderModal
              id={modifiedData.id}
              errorDetails={errorDetails}
              setIsVisible={loadModal}
              loaderVisible={showLoader}
            />
          )}
        </Box>
      </ModalBody>
    </ModalLayout>
  );
};

export default MigratePreview;
