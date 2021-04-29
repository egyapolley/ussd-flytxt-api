const axios = require("axios")
const moment = require("moment")
const uuidV4 = require("uuid")

const systemTime =`${moment().format("YYYY-MM-DD HH:mm:ss")} ${moment().format("Z").replace(/:/g,"")}`
const offerId ="701"
const txnId = uuidV4.v4()
const msisdn="233255000973"

const url = `https://ncs.flytxt.com/rest/authkey/UJrDCgOhtw/msisdn/${msisdn}/kpi/events`
const data = {
    event: [
        {
            id: "36",
            type: "USSD",
            value: `${offerId},Reward Activation Success,100,${txnId}`,
            date: systemTime
        }
    ]
}

console.log(data)
axios.post(url,data)
    .then(response =>console.log(response.data))
    .catch(error =>console.log(error))






