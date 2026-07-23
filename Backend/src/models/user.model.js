import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export function normalizeEmail(email) {
    if (!email) return "";
    let [local, domain] = email.toLowerCase().trim().split("@");
    if (!domain) return email;
    if (domain === "gmail.com" || domain === "googlemail.com") {
        local = local.replace(/\./g, "").split("+")[0];
    }
    return `${local}@${domain}`;
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    normalizedEmail: {
        type: String,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
        default: null,
    },
    verificationTokenExpires: {
        type: Date,
        default: null,
    },
    lastVerificationSentAt: {
        type: Date,
        default: null,
    },
    plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
    },
    subscriptionStatus: {
        type: String,
        default: null,
    },
    paymentProvider: {
        type: String,
        default: null,
    },
    paymentCustomerId: {
        type: String,
        default: null,
    },
    paymentSubscriptionId: {
        type: String,
        default: null,
    },
    introductoryOfferUsed: {
        type: Boolean,
        default: false,
    },
    proStartedAt: {
        type: Date,
        default: null,
    },
    currentPeriodStart: {
        type: Date,
        default: null,
    },
    currentPeriodEnd: {
        type: Date,
        default: null,
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
    },
    proPreviewGranted: {
        type: Boolean,
        default: true,
    },
    proPreviewRemaining: {
        type: Number,
        default: 5,
    },
    proPreviewUsedAt: {
        type: [Date],
        default: [],
    }
},
 { timestamps: true }
);

userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isModified("email") || !this.normalizedEmail) {
        this.normalizedEmail = normalizeEmail(this.email);
    }
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

const userModel = mongoose.model("User", userSchema);
export default userModel;
