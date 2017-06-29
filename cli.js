/* load npm packages */

const inquirer = require("inquirer");
const axios = require("axios");

// create variables 
let addressesArray = [];
let selectedAddress = [];

/* create CLI */

function startCli() {
  // get wallet list and store in addressesArray
  axios
    .post('http://localhost:5279/lbryapi', {
      'method': 'wallet_list',
    })
    .then(response => {
      addressesArray = response.data.result;
      console.log('addresses found and loaded');
      promptQuestions();
    })
    .catch(error => {
      console.log(error.message);
      console.log("TERMINAL ERROR");
    });
}

function promptQuestions(){  // main function that runs the CLI 
  inquirer.prompt([{
    type: "list",
    name: "action",
    message: "What action would you like to take?",
    choices: [
      "Get total balance",
      "See all balances", 
      "See all balances (unconfirmed)", 
      "Evenly Distribute LBC", 
      "Exit"
    ]
  }]).then(function(answer){
    switch (answer.action) {
      case "Get total balance":
        getTotalBalance();
        break;
      case "See all balances":
        getAllBalances();
        break;
      case "See all balances (unconfirmed)":
        getAllBalancesUnconfirmed();
        break;
      case "Evenly Distribute LBC":
        EvenlyDistributeLbc();
        break;
      case "Exit":
        process.exit();
        break;
      default: break;
    }
  });
}

function getTotalBalance(){ 
  axios
    .post('http://localhost:5279/lbryapi', {
      'method': 'wallet_balance'
    })
    .then(response => {
      let balance = response.data.result;
      console.log("-----");
      console.log(`Your total balance is: ${balance} LBC`);
    })
    .catch(error => {
      console.log(error.message.data.error);
    });
}

function getAllBalances(){
  console.log("-----"); 
  for (var i = 0; i < addressesArray.length; i++) {
    let thisAddress = addressesArray[i];
    axios
      .post('http://localhost:5279/lbryapi', 
        {
          'method': 'wallet_balance',
          'params': {'address': thisAddress}
        }
      )
      .then(response => {
        let balance = response.data.result;
        console.log(`${thisAddress}: ${balance} LBC`);
      })
      .catch(error => {
        console.log(error.message.data.error);
      });
  }
}

function getAllBalancesUnconfirmed() { 
  for (var i = 0; i < addressesArray.length; i++) {
    let thisAddress = addressesArray[i];
    axios
      .post('http://localhost:5279/lbryapi', {
        'method': 'wallet_balance',
        'params': {'address': thisAddress, 'include_unconfirmed': true}
      })
      .then(response => {
        //console.log(response);
        let balance = response.data.result;
        //console.log(balance)
        console.log(`${thisAddress}: ${balance} LBC`);
      })
      .catch(error => {
        console.log(error.message.data.error);
      });
  }
}

function EvenlyDistributeLbc() {
  console.log("-----");
  // get total balance
  axios
    .post('http://localhost:5279/lbryapi', {
      'method': 'wallet_balance'
    })
    .then(response => {
      let balance = response.data.result;
      console.log(balance);
      let fundsToEachWallet = (Math.round(balance / addressesArray.length * 1000) / 1000);
      //check that the math was right and wont overflow 
      if ((fundsToEachWallet * addressesArray.length) > balance) {
        console.log("there was a rounding error.  No funds were transfered.  Exiting CLI.")  
      }
      // initiate a transfer for each wallet address
      for (var i = 0; i < addressesArray.length; i++){
        let thisAddress = addressesArray[i];
          axios
            .post('http://localhost:5279/lbryapi', {
              'method': 'send_amount_to_address',
              'params': {'amount': fundsToEachWallet, 'address': thisAddress}
            })
            .then(response => {
              //console.log(response);
              let result = response.data.result;
              //console.log(balance)
              console.log(`${thisAddress}: ${result}`);
            })
            .catch(error => {
              console.log(error);
            });
      }
    })
    .catch(error => {
      console.log(error.message.data.error);
    });
}


/* start the cli */ 
startCli();
