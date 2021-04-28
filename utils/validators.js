const Joi = require("joi");

module.exports = {


    validatePackagePurchase: (body) => {

        const schema = Joi.object({
            subscriberNumber: Joi.string()
                .length(12)
                .alphanum()
                .regex(/^233.+/)
                .required()
                .messages({"string.pattern.base": "subscriberNumber must start with 233"}),

            channel: Joi.string()
                .alphanum()
                .min(3)
                .max(50)
                .required(),

            transactionId: Joi.string()
                .min(3)
                .max(300)
                .required(),


            offerId: Joi.string()
                .min(1)
                .max(255)
                .required(),
            mobileMoneyWallet: Joi.string()
                .min(1)
                .max(20)
                .required(),
            mobileMoneyProvider: Joi.string()
                .min(1)
                .max(20)
                .required(),
            offerName: Joi.string()
                .min(1)
                .max(255)
                .required(),
            accountId: Joi.string()
                .alphanum()
                .required(),
        });

        return schema.validate(body)


    },


    validateDataRecharge: (body) => {
        const schema = Joi.object({
            subscriberNumber: Joi.string()
                .length(12)
                .alphanum()
                .regex(/^233.+/)
                .required()
                .messages({"string.pattern.base": "subscriberNumber must start with 233"}),

            channel: Joi.string()
                .alphanum()
                .min(3)
                .max(50)
                .required(),
            transactionId: Joi.string()
                .min(3)
                .max(300)
                .required(),

            offerId: Joi.string()
                .min(1)
                .max(255)
                .required(),

            offerName: Joi.string()
                .min(1)
                .max(255)
                .required(),


            subscriptionType: Joi.string()
                .valid('One-Off', 'Recurrent')
                .required(),

        });

        return schema.validate(body)

    },


}

