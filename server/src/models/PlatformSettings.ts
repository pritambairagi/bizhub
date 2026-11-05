import mongoose, { Schema, Document } from 'mongoose';

export interface PlatformSettingsDocument extends Document {
  maintenance: boolean;
  registrationOpen: boolean;
  maxBusinessesPerUser: number;
  defaultSubscriptionPlan: string;
  emailVerificationRequired: boolean;
  minPasswordLength: number;
  sessionTimeoutMinutes: number;
  allowedBusinessTypes: string[];
  supportEmail: string;
  supportPhone: string;
  platformVersion: string;
  termsVersion: string;
  privacyVersion: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultTimezone: string;
  maxUploadSizeMb: number;
  allowGuestCheckout: boolean;
  loyaltyPointsEnabled: boolean;
  loyaltyPointsRate: number;
  taxEnabled: boolean;
  defaultTaxRate: number;
  smsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  marqueeMessage: string;
  developerNotice: string;
  serviceCharge: number;
  deliveryCharge: number;
  locationText: string;
  numberVerificationRequired: boolean;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<any>({
  maintenance:                { type: Boolean, default: false },
  registrationOpen:           { type: Boolean, default: true },
  maxBusinessesPerUser:       { type: Number, default: 5 },
  defaultSubscriptionPlan:    { type: String, default: 'free' },
  emailVerificationRequired:  { type: Boolean, default: false },
  minPasswordLength:          { type: Number, default: 6 },
  sessionTimeoutMinutes:      { type: Number, default: 60 },
  allowedBusinessTypes:       [{ type: String }],
  supportEmail:               { type: String, default: 'support@bizhub.com' },
  supportPhone:               { type: String, default: '+880-1700-000000' },
  platformVersion:            { type: String, default: '2.0.0' },
  termsVersion:               { type: String, default: '1.0' },
  privacyVersion:             { type: String, default: '1.0' },
  smtpHost:                   { type: String, default: '' },
  smtpPort:                   { type: Number, default: 587 },
  smtpUser:                   { type: String, default: '' },
  defaultLanguage:            { type: String, default: 'en' },
  defaultCurrency:            { type: String, default: 'BDT' },
  defaultTimezone:            { type: String, default: 'Asia/Dhaka' },
  maxUploadSizeMb:            { type: Number, default: 10 },
  allowGuestCheckout:         { type: Boolean, default: false },
  loyaltyPointsEnabled:       { type: Boolean, default: true },
  loyaltyPointsRate:          { type: Number, default: 1 },
  taxEnabled:                 { type: Boolean, default: true },
  defaultTaxRate:             { type: Number, default: 5 },
  smsEnabled:                 { type: Boolean, default: false },
  emailNotificationsEnabled:  { type: Boolean, default: true },
  pushNotificationsEnabled:   { type: Boolean, default: false },
  marqueeMessage:             { type: String, default: 'Welcome to BizHub ERP & POS!' },
  developerNotice:            { type: String, default: '' },
  serviceCharge:              { type: Number, default: 0 },
  deliveryCharge:             { type: Number, default: 0 },
  locationText:               { type: String, default: 'Dhaka, Bangladesh' },
  numberVerificationRequired: { type: Boolean, default: false },
}, { timestamps: true });

export const PlatformSettings = mongoose.model<PlatformSettingsDocument>('PlatformSettings', platformSettingsSchema);
