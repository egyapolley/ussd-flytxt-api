const express = require("express");
const router = express.Router();
const User = require("../model/user");
const validator = require("../utils/validators");
const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;


const soapRequest = require("easy-soap-request");
const parser = require('fast-xml-parser');
const he = require('he');
const options = {
    attributeNamePrefix: "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName: "#text",
    ignoreAttributes: true,
    ignoreNameSpace: true,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    arrayMode: false,
    attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),
    tagValueProcessor: (val, tagName) => he.decode(val),
    stopNodes: ["parse-me-as-string"]
};

passport.use(new BasicStrategy(
    function (username, password, done) {
        User.findOne({username: username}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            user.comparePassword(password, function (error, isMatch) {
                if (err) return done(error);
                else if (isMatch) {
                    return done(null, user)
                } else {
                    return done(null, false);
                }

            })

        });
    }
));




router.post("/bundles_ca", passport.authenticate('basic', {
    session: false
}), async (req, res) => {

    const {error} = validator.validateDataRecharge(req.body);
    if (error) {
        return res.json({
            status: 2,
            reason: error.message
        })
    }
    const {subscriberNumber, channel,transactionId, offerId, offerName,subscriptionType} = req.body;
    if (channel.toLowerCase() !== req.user.channel) {
        return res.json({
            status: 2,
            reason: `Invalid Request channel ${channel}`
        })

    }


    const url = "http://172.25.39.16:2222"

    const sampleHeaders = {
        'User-Agent': 'NodeApp',
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://SCLINSMSVM01P/wsdls/Surfline/DATA_Recharges/DATA_Recharges',
        'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
    };


    let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:data="http://SCLINSMSVM01P/wsdls/Surfline/DATA_Recharges.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <data:DATA_RechargesRequest>
         <CC_Calling_Party_Id>${subscriberNumber}</CC_Calling_Party_Id>
         <CHANNEL>${channel}</CHANNEL>
         <TRANSACTION_ID>${transactionId}</TRANSACTION_ID>
         <BundleName>${offerName}</BundleName>
         <SubscriptionType>${subscriptionType}</SubscriptionType>
      </data:DATA_RechargesRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
        const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 7000}); // Optional timeout parameter(milliseconds)

        const {body} = response;
        let jsonObj = parser.parse(body, options);
        if (!jsonObj.Envelope.Body.DATA_RechargesResult) {
             res.json({status: 0, reason:"success"});

        }else {
            res.json({status:1, reason:"System Failure"})
        }

    } catch (error) {
        console.log(error.toString())
        let jsonObj = parser.parse(error.toString(), options);
        let faultMessage = "System Error";
        if (jsonObj && jsonObj.Envelope && jsonObj.Envelope.Body){
            const soapResponseBody = jsonObj.Envelope.Body;
            const errorCode = soapResponseBody.Fault.detail.DATA_RechargesFault.errorCode;

            switch (errorCode) {
                case 50:
                    faultMessage = "Account is not active";
                    break;
                case 51:
                    faultMessage = "Invalid Bundle";
                    break;
                case 53:
                    faultMessage = "Transient Error";
                    break;
                case 55:
                    faultMessage = "Account has insufficient credit/General Failure";
                    break;

                case 102:
                    faultMessage = "Purchase not allowed.Account has active unlimited bundle";
                    break;
                case 105:
                    faultMessage = "Purchase of this bundle  is not allowed at this time";
                    break;
            }

        }

        res.json({status:1, reason:faultMessage});

    }


})

router.post("/bundles_ep", passport.authenticate('basic', {
    session: false
}), async (req, res) => {

    const {error} = validator.validatePackagePurchase(req.body);
    if (error) {
        return res.json({
            status: 2,
            reason: error.message
        })
    }
    const {subscriberNumber,channel,accountId,offerId,offerName,transactionId,mobileMoneyWallet,mobileMoneyProvider} = req.body;
    if (channel.toLowerCase() !== req.user.channel) {
        return res.json({
            status: 2,
            reason: `Invalid Request channel ${channel}`
        })
    }

    if (accountId !== req.user.accountNumber) {
        return res.json({
            status: 2,
            reason: `Invalid Request accountId ${accountId}`
        })

    }

    const url = "http://172.25.39.16:2222";
    const sampleHeaders = {
        'User-Agent': 'NodeApp',
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://SCLINSMSVM01P/wsdls/Surfline/VoucherRecharge_USSD/VoucherRecharge_USSD',
        'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
    };

    let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dat="http://SCLINSMSVM01P/wsdls/Surfline/DATARechargeUSSDMobileMoney.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <dat:DATARechargeUSSDMoMoRequest>
         <CC_Calling_Party_Id>233888888888</CC_Calling_Party_Id>
         <CHANNEL>USSD_MoMo</CHANNEL>
         <TRANSACTION_ID>${transactionId}</TRANSACTION_ID>
         <Recipient_Number>${subscriberNumber}</Recipient_Number>
         <BundleName>${offerName}</BundleName>
         <SubscriptionType>One-Off</SubscriptionType>
         <mobileMoneyProvider>${mobileMoneyProvider}</mobileMoneyProvider>
         <mobileMoneyWallet>${mobileMoneyWallet}</mobileMoneyWallet>
      </dat:DATARechargeUSSDMoMoRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
    try {
        const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 5000}); // Optional timeout parameter(milliseconds)

        const {body} = response;

        let jsonObj = parser.parse(body, options);
        let result = jsonObj.Envelope.Body;
        if (result.DATARechargeUSSDMoMoResult && result.DATARechargeUSSDMoMoResult.ServiceRequestID) {
            let serviceRequestID = result.DATARechargeUSSDMoMoResult.ServiceRequestID;

            res.json({
                status: 0,
                reason: "success",
                serviceRequestId: serviceRequestID,
                clientTransactionId: transactionId,
            })

        }


    } catch (err) {
        let errorBody = err.toString();
        if (parser.validate(errorBody) === true) {
            let jsonObj = parser.parse(errorBody, options);
            if (jsonObj && jsonObj.Envelope && jsonObj.Envelope.Body && jsonObj.Envelope.Body.Fault) {
                let soapFault = jsonObj.Envelope.Body.Fault;
                let faultString = soapFault.faultstring;
                let errorcode = soapFault.detail.DATARechargeUSSDMoMoFault.errorCode;
                console.log(errorcode)
                switch (errorcode) {
                    case 62:
                        faultString = "Invalid Request Parameter values";
                        break;
                    case 61:
                        faultString = "subscriberNumber not valid";
                        break;

                    default:
                        faultString = "System Error";
                }
                return res.json(
                    {
                        status: 1,
                        reason: faultString,
                        serviceRequestId: null,
                        clientTransactionId: transactionId
                    })

            }
        }

        console.log(errorBody)
        res.json({error: "System Failure"})

    }

})

router.post("/user", async (req, res) => {
    try {
        let {username, password, channel, accountNumber} = req.body;
        let user = new User({
            username,
            password,
            channel,
            accountNumber
        });
        user = await user.save();
        res.json(user);

    } catch (error) {
        res.json({error: error.toString()})
    }


});

module.exports = router;

