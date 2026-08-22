const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatarColor: { type: String, default: () => randomColor() },
  },
  { timestamps: true }
);

function randomColor() {
  const colors = ['#7C3AED', '#059669', '#2563EB', '#DB2777', '#D97706', '#0891B2', '#DC2626'];
  return colors[Math.floor(Math.random() * colors.length)];
}

UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarColor: this.avatarColor,
  };
};

module.exports = mongoose.model('User', UserSchema);
