// Importing necessary modules and packages
const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/Course");
const paymentRoutes = require("./routes/Payments");
const contactUsRoute = require("./routes/Contact");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

// Setting up port number
const PORT = process.env.PORT || 4000;

// Loading environment variables from .env file
dotenv.config();

// Connecting to database
database.connect();
 
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);

// Connecting to cloudinary
cloudinaryConnect();

// Setting up routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running ...",
	});
});

// Listening to the server
app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});

// End of code.


//opertors of mongodb
// | Operator | Description                   | Example                                               |
// | -------- | ----------------------------- | ----------------------------------------------------- |
// | `$eq`    | Equals                        | `{ age: { $eq: 25 } }` — finds docs where `age == 25` |
// | `$ne`    | Not equals                    | `{ age: { $ne: 25 } }` — `age != 25`                  |
// | `$gt`    | Greater than                  | `{ age: { $gt: 25 } }` — `age > 25`                   |
// | `$gte`   | Greater than or equal         | `{ age: { $gte: 25 } }` — `age >= 25`                 |
// | `$lt`    | Less than                     | `{ age: { $lt: 25 } }` — `age < 25`                   |
// | `$lte`   | Less than or equal            | `{ age: { $lte: 25 } }` — `age <= 25`                 |
// | `$in`    | Matches any value in an array | `{ status: { $in: ["active", "pending"] } }`          |
// | `$nin`   | Not in                        | `{ status: { $nin: ["inactive", "deleted"] } }`       |


// | Operator | Description                 | Example                                                    |
// | -------- | --------------------------- | ---------------------------------------------------------- |
// | `$and`   | All conditions must be true | `{ $and: [ { age: { $gt: 18 } }, { status: "active" } ] }` |
// | `$or`    | At least one must be true   | `{ $or: [ { age: { $lt: 18 } }, { age: { $gt: 60 } } ] }`  |
// | `$not`   | Inverts the condition       | `{ age: { $not: { $gt: 18 } } }`                           |
// | `$nor`   | None must be true           | `{ $nor: [ { status: "active" }, { age: { $lt: 30 } } ] }` |


// | Operator  | Description              | Example                        |
// | --------- | ------------------------ | ------------------------------ |
// | `$exists` | Checks if a field exists | `{ email: { $exists: true } }` |
// | `$type`   | Checks data type         | `{ age: { $type: "number" } }` |


// | Operator     | Description                                        | Example                                             |
// | ------------ | -------------------------------------------------- | --------------------------------------------------- |
// | `$all`       | Match all elements                                 | `{ tags: { $all: ["node", "express"] } }`           |
// | `$elemMatch` | Match an element in array with multiple conditions | `{ scores: { $elemMatch: { $gt: 80, $lt: 100 } } }` |
// | `$size`      | Match array length                                 | `{ tags: { $size: 3 } }`                            |


// | Operator | Description          | Example                      |
// | -------- | -------------------- | ---------------------------- |
// | `$set`   | Set a new value      | `{ $set: { name: "John" } }` |
// | `$unset` | Remove a field       | `{ $unset: { age: "" } }`    |
// | `$inc`   | Increment a value    | `{ $inc: { views: 1 } }`     |
// | `$push`  | Add to an array      | `{ $push: { tags: "new" } }` |
// | `$pull`  | Remove from an array | `{ $pull: { tags: "old" } }` |



