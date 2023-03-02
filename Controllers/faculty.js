const Faculty = require("../model/Faculty");
const Student = require("../model/Student");
const Course = require("../model/Course");
("use strict");
const excelToJson = require("convert-excel-to-json");

exports.getFaculties = async (req, res, next) => {
  //   console.log("www");
  let response;
  try {
    response = await Faculty.find().populate({
      path: "courses",
      populate: {
        path: "allocatedTA",
        model: "Student",
      },
    });
    // console.log(response);
    res.status(200).send({
      data: response,
    });
  } catch (e) {
    res.status(418).send({ message: "something went wrong" });
    console.log(e.message);
  }
};

exports.postTAtoFaculty = async (req, res, next) => {
  //   console.log("www");
  const { students } = req.body;
  const { faculty } = req.body;
  const { courses } = req.body;

  //   console.log(info);

  if (!students || !faculty || !courses) {
    res.status(418).send({ message: "missing data" });
  }

  try {
    for (let i of students) {
      // let sample = "student1(102001012)";
      // console.log(sample.match(/\(([^)]+)\)/)[1]);
      // let sample1 = sample.match(/\(([^)]+)\)/)[0];
      // console.log(sample.replace(sample1, ""));
      const roll = i.value.match(/\(([^)]+)\)/)[1];
      const temp = i.value.match(/\(([^)]+)\)/)[0];
      const studentName = i.value.replace(temp, "");

      const getStudent = await Student.find({
        rollNumber: roll,
        name: studentName,
      });

      if (getStudent.length === 0) {
        res.status(408).send({ message: "Student not found" });
        return;
      }
      if (getStudent[0].isAssgined === true) {
        res.status(410).send({ message: "Student is already a TA" });
        return;
      }
      const getFaculty = await Faculty.find({ email: faculty.email });
      if (getFaculty.length === 0) {
        res.status(409).send({ message: "Faculty not found" });
        return;
      }

      const getCourse = await Course.find({ name: courses.value });

      try {
        getCourse[0].allocatedTA.push(getStudent[0]._id);
        await getCourse[0].save();
      } catch (e) {
        res.status(418).send({ message: "something went wrong" });
        console.log(e.message);
      }

      try {
        getStudent[0].isAssgined = true;
        getStudent[0].assignedCourse = getCourse[0]._id;
        getStudent[0].assignedFaculty = getFaculty[0]._id;
        await getStudent[0].save();
      } catch (e) {
        res.status(418).send({ message: "something went wrong" });
        console.log(e.message);
      }
    }
    res.status(200).send({ message: "TA's has been allocated" });
    console.log("TA's has been allocated");
  } catch (e) {
    console.log(e.message);
    res.status(418).send({ message: "something went wrong" });
  }
};

exports.postFaculty = async (req, res, next) => {
  // const { name } = req.body;
  // const { email } = req.body;

  // if (!name || !email) {
  //   res.status(418).send({ message: "missing data" });
  // }

  // try {
  //   await Faculty.create({ name: name, email: email });
  //   console.log("Faculty added");
  //   res.status(200).send({ message: "Faculty has been added" });
  // } catch (e) {
  //   console.log(e.message);
  //   res.status(417).send({ message: "Faculty has not been added" });
  // }

  try {
    if (req.file == undefined) {
      return res.status(400).send("Please upload an excel file!");
    }
    // console.log(req.file);
    const result = excelToJson({
      sourceFile: `./upload/${req.file.originalname}`,
      header: {
        rows: 1,
      },
    });
    // console.log(result);
    for (let i of result.Sheet1) {
      const fc = await Faculty.find({ name: i.A, email: i.B });
      if (fc.length === 0) {
        await Faculty.create({ name: i.A, email: i.B });
        await Course.create({ name: i.C });
        const ft = await Faculty.find({ name: i.A, email: i.B });
        const cr = await Course.find({ name: i.C });

        ft[0].courses.push(cr[0]._id);
        cr[0].allocatedFaculty = ft[0]._id;
        await ft[0].save();
        await cr[0].save();
      }
    }

    console.log("Faculties has been added");
    res.status(200).send({ message: "Faculties has been added" });
  } catch (e) {
    console.log(e.message);
    res.status(400).send({ message: "something went wrong" });
  }
};

exports.postFacultyCourse = async (req, res, next) => {
  console.log("get Faculty");
  const { email } = req.body;
  let response;
  try {
    response = await Faculty.find({ email: email }).populate("courses");
    // console.log(response);
    res.status(200).send({
      data: response[0],
    });
    // console.log("data sent");
  } catch (e) {
    res.status(418).send({ message: "something went wrong" });
    console.log(e.message);
  }
};