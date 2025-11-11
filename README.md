# Lab: MongoDB & Mongoose

## 📘 Overview of the Lab
In this lab, students will learn how to use MongoDB via the **command line (mongosh)** and how to interact with MongoDB through **Node.js using Mongoose**. The lab covers cluster setup, database creation, CRUD operations, and schema modeling.

---
> **Note:** Follow `server.js` to implement the lab. The file contains TODO blocks that describe exactly what to build.

## 📖 Reading Assignment
- **7.1 MongoDB:** [https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/7/section/1](https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/7/section/1)
- **7.2 Mongoose:** [https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/7/section/2](https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/7/section/2)

---

## 💡 Concepts Used in the Lab

### 🔸 MongoDB Concepts
1. **MongoDB Document Database**  
   MongoDB stores data in flexible, JSON-like documents instead of tables. Each document is a collection of key–value pairs that can hold arrays and nested data.

2. **MongoDB Shell (mongosh)**  
   A command-line interface to interact with MongoDB databases. It allows executing CRUD operations directly using MongoDB query syntax.

3. **Inserting Documents (via mongosh)**  
   ```js
   db.collection.insertOne({ name: "Ali", age: 22 })
   db.collection.insertMany([{ name: "Sara", age: 23 }, { name: "Ahmed", age: 24 }])
   ```

4. **Finding Documents (via mongosh)**  
   ```js
   db.collection.find()
   db.collection.find({ age: { $gt: 21 } })
   ```

5. **Updating Documents (via mongosh)**  
   ```js
   db.collection.updateOne({ name: "Ali" }, { $set: { age: 23 } })
   db.collection.updateMany({}, { $inc: { age: 1 } })
   ```

6. **Deleting Documents (via mongosh)**  
   ```js
   db.collection.deleteOne({ name: "Sara" })
   db.collection.deleteMany({ age: { $lt: 20 } })
   ```

---

### 🔸 Mongoose Concepts

1. **Schemas and Models**  
   Define structure and validation for MongoDB documents within Node.js.  
   ```js
   import mongoose from "mongoose";

   const studentSchema = new mongoose.Schema({
     name: String,
     age: Number,
     major: String
   });

   const Student = mongoose.model("Student", studentSchema);
   ```

2. **Connecting to MongoDB**  
   ```js
   mongoose.connect("mongodb+srv://<db_username>:<db_password>@cluster.mongodb.net")
   .then(() => console.log("Connected"))
   .catch(err => console.log(err));
   ```

3. **Finding Documents (Node.js)**  
   ```js
   const allStudents = await Student.find();
   const csStudents = await Student.find({ major: "CS" });
   ```

4. **Updating and Deleting Documents (Node.js)**  
   ```js
   await Student.updateOne({ name: "Ali" }, { age: 23 });
   await Student.deleteOne({ name: "Sara" });
   ```

---

## ✅ Checklist Before Submitting the Lab
- [ ] MongoDB cluster created successfully on Atlas  
- [ ] Database user added and IP access granted  
- [ ] Connected to MongoDB using `mongosh`  
- [ ] Performed all CRUD operations via mongosh  
- [ ] Established Mongoose connection in VS Code  
- [ ] Created schema and performed CRUD in Node.js  
- [ ] Console output verified for success messages  
- [ ] Code and screenshots saved in submission folder  

---
