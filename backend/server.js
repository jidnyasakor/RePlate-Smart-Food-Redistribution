const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Food = require("./models/Food");
const User = require
("./models/User");
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://replateUser:Piano5926@cluster0.mzfkb1y.mongodb.net/?appName=Cluster0")

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

.then(() => console.log("MongoDB Connected ✅"))
.catch((err) => console.log("DB Error:", err));

app.get("/", (req, res) => {
  res.send("RePlate Backend Running 🚀");
});

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

    res.status(500).json({
      message: "Error adding food",
      error
    });

  }

});

app.get("/all-food", async (req, res) => {
  try {
    const foods = await Food.find({
      expiryAt: { $gt: new Date() }
    });
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ message: "Error fetching food ❌", error });
  }
});

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

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Registration failed",
      error
    });

  }

});

app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (error) {

    res.status(500).json({
      message: "Login failed",
      error
    });

  }

});


// GET all foods
app.get("/foods", async (req, res) => {
    try {
        const foods = await Food.find();
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET foods by donorId
app.get("/foods/:donorId", async (req, res) => {
    try {
        const foods = await Food.find({ donorId: req.params.donorId });
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE food by foodId
app.delete("/food/:foodId", async (req, res) => {
    try {

        const deletedFood = await Food.findByIdAndDelete(req.params.foodId);

        if (!deletedFood) {
            return res.status(404).json({
                message: "Food not found"
            });
        }

        res.json({
            message: "Food deleted successfully",
            deletedFood
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
});

app.put("/accept-food/:foodId", async (req, res) => {
  try {
    const { ngoId } = req.body;

    const food = await Food.findById(req.params.foodId);

    if (!food) {
      return res.status(404).json({
        message: "Food not found"
      });
    }

    if (food.status !== "available") {
      return res.status(400).json({
        message: "Food already accepted"
      });
    }

    food.status = "accepted";
    food.ngoId = ngoId;

    await food.save();

    res.json({
      message: "Food accepted successfully",
      food
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Get available food for NGOs
app.get("/available-food", async (req, res) => {

  try {

    const foods = await Food.find({
      status: "available"
    });

    res.json(foods);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// Volunteer pickup assignment
app.put("/pickup-food/:foodId", async (req, res) => {

  try {

    const { volunteerId } = req.body;

    const food = await Food.findById(req.params.foodId);

    if (!food) {
      return res.status(404).json({
        message: "Food not found"
      });
    }

    if (food.status !== "accepted") {
      return res.status(400).json({
        message: "Food must be accepted by NGO first"
      });
    }

    food.volunteerId = volunteerId;
    food.pickupStatus = "assigned";
    food.status = "picked";

    await food.save();

    res.json({
      message: "Pickup assigned successfully",
      food
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// Donor dashboard
app.get("/donor-food/:donorId", async (req, res) => {

  try {

    const foods = await Food.find({
      donorId: req.params.donorId
    });

    res.json(foods);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// NGO dashboard
app.get("/ngo-food/:ngoId", async (req, res) => {

  try {

    const foods = await Food.find({
      ngoId: req.params.ngoId
    });

    res.json(foods);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// Volunteer dashboard
app.get("/volunteer-food/:volunteerId", async (req, res) => {

  try {

    const foods = await Food.find({
      volunteerId: req.params.volunteerId
    });

    res.json(foods);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// Volunteer accepts pickup
app.put("/assign-volunteer/:foodId", async (req, res) => {

  try {

    const { volunteerId } = req.body;

    const food = await Food.findById(req.params.foodId);

    if (!food) {
      return res.status(404).json({
        message: "Food not found"
      });
    }

    food.volunteerId = volunteerId;
    food.pickupStatus = "assigned";

    await food.save();

    res.json({
      message: "Volunteer assigned",
      food
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// Volunteer marks picked
app.put("/mark-picked/:foodId", async (req, res) => {

  try {

    const food = await Food.findById(req.params.foodId);

    if (!food) {
      return res.status(404).json({
        message: "Food not found"
      });
    }

    food.pickupStatus = "picked";
    food.status = "picked";

    await food.save();

    res.json({
      message: "Food picked successfully",
      food
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// Get foods accepted by NGO
app.get("/ngo-food/:ngoId", async (req, res) => {

  try {

    const foods = await Food.find({
      ngoId: req.params.ngoId
    });

    res.json(foods);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

app.get("/dashboard-stats", async (req, res) => {

  try {

    const totalFood = await Food.countDocuments();

    const availableFood = await Food.countDocuments({
      status: "available"
    });

    const acceptedFood = await Food.countDocuments({
      status: "accepted"
    });

    const pickedFood = await Food.countDocuments({
      status: "picked"
    });

    const expiredFood = await Food.countDocuments({
      status: "expired"
    });

    res.json({
      totalFood,
      availableFood,
      acceptedFood,
      pickedFood,
      expiredFood
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});