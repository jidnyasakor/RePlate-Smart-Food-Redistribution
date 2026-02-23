const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Food = require("./models/Food");
const User = require("./models/User");

const app = express();

app.use(express.json());
app.use(cors());

/* ===========================
   MONGODB CONNECTION
=========================== */

mongoose.connect("mongodb+srv://replateUser:Jidnya59@cluster0.mzfkb1y.mongodb.net/replateDB")
.then(() => {

  console.log("MongoDB Connected ✅");

  // Expiry auto-check every 1 minute
  setInterval(async () => {
    const now = new Date();

    await Food.updateMany(
      {
        expiryAt: { $lt: now },
        status: { $ne: "expired" }
      },
      {
        status: "expired"
      }
    );

    console.log("Expiry check done");

  }, 60000);

})
.catch((err) => console.log("DB Error:", err));


/* ===========================
   BASIC ROUTE
=========================== */

app.get("/", (req, res) => {
  res.send("RePlate Backend Running 🚀");
});


/* ===========================
   REGISTER
=========================== */

app.post("/register", async (req, res) => {

  try {

    const { name, email, password, role, phone, location } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      location
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }

});


/* ===========================
   LOGIN
=========================== */

app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }

});


/* ===========================
   ADD FOOD
=========================== */

app.post("/add-food", async (req, res) => {

  try {

    const {
      foodName,
      quantity,
      location,
      cookingTime,
      safeDurationHours,
      donorId
    } = req.body;

    const expiryAt = new Date(cookingTime);
    expiryAt.setHours(expiryAt.getHours() + safeDurationHours);

    const food = new Food({
      foodName,
      quantity,
      location,
      cookingTime,
      safeDurationHours,
      expiryAt,
      donorId
    });

    await food.save();

    res.status(201).json({
      message: "Food added successfully",
      food
    });

  } catch (error) {
    res.status(500).json({ message: "Error adding food", error });
  }

});


/* ===========================
   GET ROUTES
=========================== */

app.get("/foods", async (req, res) => {
  const foods = await Food.find();
  res.json(foods);
});

app.get("/donor-food/:donorId", async (req, res) => {
  const foods = await Food.find({ donorId: req.params.donorId });
  res.json(foods);
});

app.get("/ngo-food/:ngoId", async (req, res) => {
  const foods = await Food.find({ ngoId: req.params.ngoId });
  res.json(foods);
});

app.get("/volunteer-food/:volunteerId", async (req, res) => {
  const foods = await Food.find({ volunteerId: req.params.volunteerId });
  res.json(foods);
});

app.get("/available-food", async (req, res) => {
  const foods = await Food.find({ status: "available" });
  res.json(foods);
});


/* ===========================
   DELETE FOOD
=========================== */

app.delete("/food/:foodId", async (req, res) => {

  const deletedFood = await Food.findByIdAndDelete(req.params.foodId);

  if (!deletedFood) {
    return res.status(404).json({ message: "Food not found" });
  }

  res.json({ message: "Food deleted successfully" });

});


/* ===========================
   ACCEPT FOOD (NGO)
=========================== */

app.put("/accept-food/:foodId", async (req, res) => {

  const { ngoId } = req.body;

  const food = await Food.findById(req.params.foodId);

  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }

  if (food.status !== "available") {
    return res.status(400).json({ message: "Food already accepted" });
  }

  food.status = "accepted";
  food.ngoId = ngoId;

  await food.save();

  res.json({ message: "Food accepted successfully", food });

});


/* ===========================
   ASSIGN VOLUNTEER
=========================== */

app.put("/assign-volunteer/:foodId", async (req, res) => {

  const { volunteerId } = req.body;

  const food = await Food.findById(req.params.foodId);

  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }

  food.volunteerId = volunteerId;
  food.pickupStatus = "assigned";

  await food.save();

  res.json({ message: "Volunteer assigned", food });

});


/* ===========================
   MARK PICKED
=========================== */

app.put("/mark-picked/:foodId", async (req, res) => {

  const food = await Food.findById(req.params.foodId);

  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }

  food.status = "picked";
  food.pickupStatus = "picked";

  await food.save();

  res.json({ message: "Food picked successfully", food });

});


/* ===========================
   SERVER START
=========================== */

app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});