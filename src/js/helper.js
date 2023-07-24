import {
  addUrl,
  buildThing,
  createAclFromFallbackAcl, getResourceAcl, getStringNoLocale, getThing, hasAccessibleAcl, hasFallbackAcl, hasResourceAcl, overwriteFile, saveSolidDatasetAt, setThing
} from "@inrupt/solid-client";
import { DCTERMS, SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf";
import dayjs from "dayjs";
import { enqueueSnackbar } from "notistack";
import { hasVersionPredicate } from "./urls";
import { getVersionedDataset, getVersionedDatasetHandle } from "./versioningLayer";

export const displayError = (message) => enqueueSnackbar(message, { variant: "error" });

export const pathToName = (url) => {
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Extract the part after the last slash
  const parts = url.split("/");
  let resourceName = parts[parts.length - 1];

  // If there is nothing after the last slash, extract the part between the last two slashes
  if (resourceName === "") {
    resourceName = parts[parts.length - 2];
  }

  return resourceName;
};

export const pathToContainer = (url) => {
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Extract the part after the last slash
  const parts = url.split("/");
  const containerParts = parts.slice(0, -1);
  const containerName = containerParts.join("/") + "/";

  return containerName;
};

// Get the ACL for a given resource dataset. Creates an ACL if it is not available
export const tryGetResourceAcl = (resourceDataset) => {
  let sharedResourcesAcl;
  if (!hasResourceAcl(resourceDataset)) {
    if (!hasAccessibleAcl(resourceDataset)) {
      throw new Error("1. No perms to change access rights");
    }
    if (!hasFallbackAcl(resourceDataset)) {
      throw new Error("2. No perms to see who can access this resource");
    }
    sharedResourcesAcl = createAclFromFallbackAcl(resourceDataset);
  } else {
    sharedResourcesAcl = getResourceAcl(resourceDataset);
  }
  return sharedResourcesAcl;
};

export const extractAddressFromThing = (addressThing) => {
  const addr = {
    street: getStringNoLocale(addressThing, SCHEMA_INRUPT.streetAddress),
    postalCode: getStringNoLocale(addressThing, SCHEMA_INRUPT.postalCode),
    locality: getStringNoLocale(addressThing, SCHEMA_INRUPT.addressLocality),
    region: getStringNoLocale(addressThing, SCHEMA_INRUPT.addressRegion),
    country: getStringNoLocale(addressThing, SCHEMA_INRUPT.addressCountry),
  };
  if (
    addr.street === null ||
    addr.postalCode === null ||
    addr.locality === null ||
    addr.region === null ||
    addr.country === null
  ) {
    return null;
  }
  return addr;
};

export const convertUnixToDatestring = (timestamp) => {
  return dayjs.unix(timestamp).locale("en-au").format("DD/MM/YYYY HH:mm:ss");
};

////////////////////////////////////////////////////////////////////////////////
/////                             Address Layer                            /////
////////////////////////////////////////////////////////////////////////////////

export const getURLAddressAndVersions = async (datasetURL, options) => {
  const datasetHandle = await getVersionedDatasetHandle(datasetURL, options);
  const hasVersion = datasetHandle.meta.hasVersion !== null ? datasetHandle.meta.hasVersion : 1;

  const urlAddresses = [];
  for (let version = 1; version <= hasVersion; version++) {
    console.log("Getting version,", version, "of", datasetHandle);
    const { dataset, handle } = await getVersionedDataset(datasetHandle, version, options);

    const datasetAddressThing = getThing(dataset, datasetURL);
    if (datasetAddressThing === null) {
      console.log("Shared resource does not have address thing: ", datasetURL, dataset);
      return [];
    }
    const address = { ...extractAddressFromThing(datasetAddressThing), versionDate: handle.meta.mtime };
    if (address === null) {
      console.log("No address present in shared file");
      return [];
    }
    urlAddresses.push(address);
  }

  return urlAddresses;
};

export const addressObjToString = (o) => {
  return `${o.street}, ${o.locality} ${o.postalCode}, ${o.region}, ${o.country}`;
};


////////////////////////////////////////////////////////////////////////////////
/////                           Versioning Layer                           /////
////////////////////////////////////////////////////////////////////////////////

export const saveUpdatedFile = async (editorText, requestURL, hasVersion, contentType, session, contributors) => {
  const container = pathToContainer(requestURL);
  const name = pathToName(requestURL);
  console.log(`Saving\n${editorText}\nat\n${requestURL}\nor in ${container} with name ${name}`);

  // await saveFileInContainer(
  //   container,
  //   new File([editorText], name, { type: contentType }),
  //   { slug: name, contentType: contentType, fetch: session.fetch }
  // );

  await overwriteFile(
    requestURL,
    new File([editorText], pathToName(requestURL), { type: contentType }),
    { contentType: contentType, fetch: session.fetch }
  );

  // Reset metadata(overwrite file kills all metadata :( )
  const baseHandle = await getVersionedDatasetHandle(requestURL, { fetch: session.fetch });
  let baseMetaset = baseHandle.metaResourceInfo;
  let baseMetathing = buildThing(getThing(baseMetaset, baseHandle.baseURL))
    .addUrl(DCTERMS.contributor, session.info.webId)
    .setInteger(hasVersionPredicate, hasVersion)
    .build();

  for (const contributor of contributors) {
    baseMetathing = addUrl(baseMetathing, DCTERMS.contributor, contributor);
  }

  baseMetaset = setThing(baseMetaset, baseMetathing);
  await saveSolidDatasetAt(baseHandle.metaURL, baseMetaset, { fetch: session.fetch });

};
