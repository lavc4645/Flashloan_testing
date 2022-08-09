require("dotenv").config();
const Web3 = require("web3");
const { ChainId, Token, TokenAmount, Pair } = require("@uniswap/sdk");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const Flashloan = require("./build/contracts/Flashloan.json");
const Arbitrage = require("./build/contracts/TestArbitrage.json");
const DaiFaucet = require("./build/contracts/DaiFaucet.json");
const VaultManager = require("./build/contracts/VaultManager.json");

const web3 = new Web3("http://127.0.0.1:8545");
const admin = "0x4715a8aA07ce3CfA89D5D05660EBe7DfF3df7beE";

const kyber = new web3.eth.Contract(
  abis.kyber.kyberNetworkProxy,
  addresses.kyber.kyberNetworkProxy
);

const AMOUNT_ETH = 100;
const RECENT_ETH_PRICE = 230; // Price in USD
const AMOUNT_ETH_WEI = web3.utils.toWei(AMOUNT_ETH.toString());
const AMOUNT_DAI_WEI = web3.utils.toWei(
  (AMOUNT_ETH * RECENT_ETH_PRICE).toString()
);
const DIRECTION = {
  KYBER_TO_UNISWAP: 0,
  UNISWAP_TO_KYBER: 1,
};

const init = async () => {
  const networkId = await web3.eth.net.getId();
  console.log(networkId);
  const daiFaucetAddress = DaiFaucet.networks[networkId].address;

  const flashloan = new web3.eth.Contract(
    Flashloan.abi,
    Flashloan.networks[networkId].address
  );
  console.log("R", AMOUNT_DAI_WEI);

  const dai = new web3.eth.Contract(abis.tokens.erc20, addresses.tokens.dai);
  const vaultManager = new web3.eth.Contract(
    VaultManager.abi,
    VaultManager.networks[networkId].address
  );

  const DAI_FROM_MAKER = web3.utils.toWei("30000");

  console.log(`Borrowing ${web3.utils.fromWei(DAI_FROM_MAKER)} DAI from Maker`);
  await vaultManager.methods
    .openVault(
      addresses.makerdao.CDP_MANAGER,
      addresses.makerdao.MCD_JUG,
      addresses.makerdao.MCD_JOIN_ETH_A,
      addresses.makerdao.MCD_JOIN_DAI,
      DAI_FROM_MAKER
    )
    .send({
      from: admin,
      gas: 1000000,
      gasPrice: 25960022604,
      value: web3.utils.toWei("60000"),
    });

  //await new Promise(resolve => setTimeout(resolve, 30000));
  console.log(
    `Transfering ${web3.utils.fromWei(DAI_FROM_MAKER)} DAI to DaiFaucet`
  );
  console.log("Admin:", admin);
  const bal = await web3.eth.getBalance(admin);
  console.log("Balance", bal);
  await dai.methods.transfer(daiFaucetAddress, DAI_FROM_MAKER).send({
    from: admin,
    gas: 1000000,
    gasPrice: 25960022604,
  });
  const daiFaucetBalance = await dai.methods.balanceOf(daiFaucetAddress).call();
  console.log(
    `DAI balance of DaiFaucet: ${web3.utils.fromWei(daiFaucetBalance)}`
  );
  const daiFaucetBalance1 = await dai.methods
    .balanceOf("0xcB79B6271Dd3eDa1547c041ee85D28943F8E2A8e")
    .call();
  console.log(
    `DAI balance of Flashloan: ${web3.utils.fromWei(daiFaucetBalance1)}`
  );

  const tx1 = flashloan.methods.initiateFlashloan(
    addresses.dydx.solo,
    addresses.tokens.dai,
    AMOUNT_DAI_WEI,
    DIRECTION.UNISWAP_TO_KYBER
  );
  // const [gasPrice, gasCost] = await Promise.all([
  //   web3.eth.getGasPrice(),
  //   tx1.estimateGas({ from: admin }),
  // ]);
  //const gasCost = await tx1.estimateGas({ from: admin });
  //console.log("estimating gas", addresses.dydx.solo);
  // let [gasPrice, gasCost1, gasCost2] = await Promise.all([
  //   web3.eth.getGasPrice(),
  //   tx1.estimateGas({ from: admin }),
  //   tx1.estimateGas({ from: admin }),
  // ]);

  // console.log("initiating arbitrage Kyber => Uniswap");
  // const data = tx1.encodeABI();
  // const txData = {
  //   from: admin,
  //   to: flashloan.options.address,
  //   data,
  //   gas: 30000000,
  //   gasPrice: 25960022604,
  // };
  // const createTransaction = await web3.eth.accounts.signTransaction(
  //   txData,
  //   process.env.PRIVATE_KEY
  // );
  // const createReceipt = await web3.eth.sendSignedTransaction(
  //   createTransaction.rawTransaction
  // );

  // console.log(`Transaction hash: ${createReceipt.rawTransaction}`);
  // const [gasPrice] = await Promise.all([web3.eth.getGasPrice()]);
  console.log("flashloan options ", flashloan.options.address);
  try {
    const data = tx1.encodeABI();
    const txData = {
      from: admin,
      to: "0x1bf5ADDdAD1bbbF414A3C52097349317d7976402",
      data,
      gas: 1000000,
      gasPrice: 25960022604,
    };
    const b = await web3.eth.sendTransaction(txData);
    console.log(b);
  } catch (e) {
    console.log("Raman Transaction Hash", e);
  }
};
init();
