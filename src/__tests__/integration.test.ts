import fetch, { Response } from "node-fetch";
import {
  IWKDidConfigVerification
} from "../index";
import { agent } from "./test-agent";

jest.setTimeout(30000);

describe(".well-known DID configuration VERIFICATION", () => {
  it("Verify DID configuration from 'test.agent.serto.xyz'", async () => {
    const prepare: Response = await fetch("https://test.agent.serto.xyz/.well-known/did-configuration.json?hasVeramo=false");
    const result = await checkDidConfigForDomain("test.agent.serto.xyz", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify DID configuration from 'nft.citizencope.com'", async () => {
    const result = await checkDidConfigForDomain("nft.citizencope.com", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify DID configuration from 'verify.serto.id'", async () => {
    const result = await checkDidConfigForDomain("verify.serto.id", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify DID configuration from 'identity.foundation'", async () => {
    const result = await checkDidConfigForDomain("identity.foundation", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify DID configuration from 'mesh.xyz'", async () => {
    const result = await checkDidConfigForDomain("mesh.xyz", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify incompatible DID configuration from 'transmute.industries'", async () => {
    const result: IWKDidConfigVerification = await checkDidConfigForDomain("transmute.industries", 0);
    console.log(JSON.stringify(result.errors, null, 4));
    expect(result.errors.length).toEqual(2);
    expect(result.valid).toBe(false);
  });

  it("Verify domain without DID configuration should fail", async () => {
    try {
      const domain = "google.com";
      const result = await agent.verifyWellKnownDidConfiguration({ domain });
      fail("Not suposed to find a DID configuration in domain: " + domain);
    }
    catch (err) {
      expect(err.message).toEqual(expect.stringMatching("Failed to download the .well-known DID configuration .*"));
    }
  });
});

describe(".well-known DID configuration creation", () => {
  it("Generate a DID configuration", async () => {
    const did = await agent.didManagerCreate({ alias: "mesh.xyz", provider: "did:ethr" });
    const result = await agent.generateDidConfiguration({
      dids: [did.did],
      domain: "mesh.xyz"
    });
    expect(result.linked_dids.length).toEqual(1);
  });

  it("Generate a DID configuration and save it", async () => {
    const did = await agent.didManagerCreate({ alias: "mesh.xyz 2", provider: "did:ethr" });
    const result = await agent.generateDidConfiguration({
      dids: [did.did],
      domain: "mesh.xyz",
      save: true
    });
    expect(result.linked_dids.length).toEqual(1);
  });

  it("Invalid domain should fail", async () => {
    try {
      await agent.generateDidConfiguration({
        dids: ["did.did"],
        domain: "mesh~.xyz"
      });
      throw "An invalid domain was accepted";
    } catch (err) {
      expect(err.message).toEqual("Invalid web domain");
    }
  });

  it("DID configuration with no DID should fail", async () => {
    try {
      await agent.generateDidConfiguration({
        dids: ["invalid-did"],
        domain: "mesh.xyz"
      });
      throw "An invalid DID was accepted";
    } catch (err) {
      expect(err.message).toEqual("Identifier not found");
    }
  });

  it("DID configuration with multiple DIDs from distinct methods", async () => {
    const didWeb = await agent.didManagerCreate({ provider: "did:web", alias: "serto.id" });
    const didKey = await agent.didManagerCreate({ provider: "did:ethr:rinkeby" });
    const result = await agent.generateDidConfiguration({
      dids: [didWeb.did, didKey.did],
      domain: "mesh.xyz"
    });
    expect(result.linked_dids.length).toEqual(2);
  });
});

async function checkDidConfigForDomain(testDomain: string, numberOfExpectedDids: number): Promise<IWKDidConfigVerification> {
  const result = await agent.verifyWellKnownDidConfiguration(
    {
      domain: testDomain,
    }
  );
  const { domain, dids, didConfiguration, errors, valid, rawDidConfiguration } = result;
  if (numberOfExpectedDids != dids.length) console.log(domain + " " + valid + " Errors: " + JSON.stringify(errors, null, 2));
  expect(domain).toBe(testDomain);
  expect(dids).toHaveLength(numberOfExpectedDids);
  return result;
}

