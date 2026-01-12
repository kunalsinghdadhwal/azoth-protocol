import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ConfidentialUnoGameModule = buildModule("ConfidentialUnoGameModule", (m) => {
  // Deploy the ConfidentialUnoGame contract
  const confidentialUnoGame = m.contract("ConfidentialUnoGame");

  return { confidentialUnoGame };
});

export default ConfidentialUnoGameModule;
