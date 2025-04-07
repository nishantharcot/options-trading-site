import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  userId: String,
  password: String
});

UserSchema.pre("save", async function (next) {
  if (!this.password) {
    return;
  }
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export const User = mongoose.model("User", UserSchema);
