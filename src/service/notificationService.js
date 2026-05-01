const Notification = require("../models/Notification");

exports.sendNotification = async ({
  req,
  userId,
  title,
  message,
  type,
  metadata = {}
}) => {
  // 1. save to DB
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    metadata
  });

  // 2. emit realtime
  const io = req.app.get("io");

  io.to(userId.toString()).emit("notification", notification);

  return notification;
};