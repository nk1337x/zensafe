const { ethers } = require("ethers");
const Alert = require("../models/Alert");
const crypto = require("crypto");
require("dotenv").config();

// Replace with your actual provider URL
const provider = new ethers.JsonRpcProvider(
  "https://open-campus-codex-sepolia.drpc.org"
);

// Replace with your deployed contract address and ABI
const contractAddress = "0x69d8317516c262d1C8d957B8Fe242f18c4C37D05";
const contractABI = [
  "function createCase(string,string,string) public",
  "function addEvidence(string,string,string,uint256) public",
  "function addQuery(string,string,uint256) public",
  "function closeCase(uint256) public",
  "function assignAuthority(uint256,address) public",
  "function getCase(uint256) view returns (uint256,string,string,string,bool)",
  "function getEvidences(uint256) view returns (tuple(uint256,string,string,string)[])",
  "function getQueries(uint256) view returns (tuple(uint256,string,string)[])",
  "function getAuthorities(uint256) view returns (address[])",
  "function getTotalCases() view returns (uint256)",
];

const wallet = new ethers.Wallet(
  "0d153561421641fa3c660aef6107acb186a1dbae70bcad092f02ebee6af801b9",
  provider
);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

const generateVideoHash = (url) => {
  return crypto.createHash("sha256").update(url).digest("hex");
};

const createCase = async (alert) => {
  if (alert.createdContract === "false") {
    const videoHash = generateVideoHash(alert.footageUrl);
    const dateTimeString = `${alert.anomalyDate} ${alert.anomalyTime}`;

    try {
      console.log("🚨 Creating a new case on the blockchain...\nLoading...");
      const tx = await contract.createCase(
        alert.location,
        videoHash,
        dateTimeString
      );
      await tx.wait(); // Wait for transaction to be mined
      console.log("✅ Case created successfully!");

      // Update the alert to mark it as processed
      await Alert.updateOne({ _id: alert._id }, { createdContract: true });
    } catch (error) {
      console.error("❌ Error creating case on blockchain:", error);
    }
  }
};

const checkAlerts = async () => {
  try {
    const latestAlert = await Alert.findOne({ createdContract: false }).sort({
      createdAt: -1,
    });
    if (latestAlert) {
      await createCase(latestAlert);
    }
  } catch (error) {
    console.error("Error checking alerts:", error);
  }
};

const addEvidence = async (caseId, mediaHash, description, dateTime) => {
  try {
    const tx = await contract.addEvidence(
      mediaHash,
      description,
      dateTime,
      caseId
    );
    await tx.wait();
  } catch (error) {
    console.error("Error adding evidence:", error);
  }
};

const addQuery = async (caseId, question, answer) => {
  try {
    const tx = await contract.addQuery(question, answer, caseId);
    await tx.wait();
  } catch (error) {
    console.error("Error adding query:", error);
  }
};

const closeCase = async (caseId) => {
  try {
    const tx = await contract.closeCase(caseId);
    await tx.wait();
  } catch (error) {
    console.error("Error closing case:", error);
  }
};

const assignAuthority = async (caseId, authorityAddress) => {
  try {
    const tx = await contract.assignAuthority(caseId, authorityAddress);
    await tx.wait();
  } catch (error) {
    console.error("Error assigning authority:", error);
  }
};

const getCase = async (caseId) => {
  try {
    return await contract.getCase(caseId);
  } catch (error) {
    console.error("Error fetching case details:", error);
  }
};

const getEvidences = async (caseId) => {
  try {
    return await contract.getEvidences(caseId);
  } catch (error) {
    console.error("Error fetching evidences:", error);
  }
};

const getQueries = async (caseId) => {
  try {
    return await contract.getQueries(caseId);
  } catch (error) {
    console.error("Error fetching queries:", error);
  }
};

const getAuthorities = async (caseId) => {
  try {
    return await contract.getAuthorities(caseId);
  } catch (error) {
    console.error("Error fetching authorities:", error);
  }
};

const getTotalCases = async () => {
  try {
    return await contract.getTotalCases();
  } catch (error) {
    console.error("Error fetching total cases:", error);
  }
};

module.exports = {
  createCase,
  checkAlerts,
  addEvidence,
  addQuery,
  closeCase,
  assignAuthority,
  getCase,
  getEvidences,
  getQueries,
  getAuthorities,
  getTotalCases,
};
