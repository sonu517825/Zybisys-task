const express = require("express");
const Ration = require("../models/ration");
const router = express.Router();
const moment = require("moment");
const mongoose = require("mongoose");


router.post("/insert_ration", async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).send({
        status: 0,
        message: "Please provide data.",
        data: "",
      });
    }

    const { packetType, qty, packetContent, expiry } = req.body;

    if (!packetType || !qty) {
      return res.status(400).send({
        status: 0,
        message: "Please provide packetType and qty.",
        data: "",
      });
    }

    const validPacketType = ["Food", "Water"];
    const validQtyF = ["500", "1000", "1500", "2000"];
    const validQtyW = ["1", "2"];

    if (validPacketType.indexOf(packetType) === -1) {
      return res.status(400).send({
        status: 0,
        message: "Please provide valid packet type ['Food' , 'Water'].",
        data: "",
      });
    }

    if (packetType === "Food" && !expiry) {
      return res.status(400).send({
        status: 0,
        message: "Please provide expairy.",
        data: "",
      });
    }

    if (packetType === "Food" && !packetContent) {
      return res.status(400).send({
        status: 0,
        message: "Please provide packetContent.",
        data: "",
      });
    }

    if (packetType === "Food" && packetContent.trim().length === 0) {
      return res.status(400).send({
        status: 0,
        message: "Please provide packetContent.",
        data: "",
      });
    }

    const correctDate = new Date(expiry);

    if (packetType === "Food" && correctDate.toString() === "Invalid Date") {
      return res.status(400).send({
        status: 0,
        message: "Please enter valid expairy date.",
        data: "",
      });
    }

    if (packetType === "Food" && !(correctDate > new Date())) {
      return res.status(400).send({
        status: 0,
        message: "Expairy date should be greater than today.",
        data: "",
      });
    }

    if (packetType === "Food" && validQtyF.indexOf(qty) === -1) {
      return res.status(400).send({
        status: 0,
        message: "Please provide quantity ['500' , '1000' , '1500' , '2000'].",
        data: "",
      });
    }

    if (packetType === "Water" && validQtyW.indexOf(qty) === -1) {
      return res.status(400).send({
        status: 0,
        message: "Please provide quantity ['1' , '2'].",
        data: "",
      });
    }

    const ration = new Ration({
      packetId:
        packetType === "Food"
          ? "F" + (Number(await Ration.countDocuments({ packetType })) + 1)
          : "W" + (Number(await Ration.countDocuments({ packetType })) + 1),
      packetType,
      packetContent,
      qty: packetType === "Food" ? qty + " Calories" : qty + " Litres",
      expiry,
    });
    const data = await ration.save();

    return res.status(201).send({
      status: 1,
      message: "Ration registered successfully.",
      data: data,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ status: 0, message: error.message, data: "" });
  }
});

router.get("/all_ration", async (req, res) => {
  try {
    let data = await Ration.aggregate([
      {
        $match: {
          is_active: true,
        },
      },
      {
        $project: {
          _id: 0,
          packetId: 1,
          packetType: 1,
          packetContent: 1,
          qty: 1,
          expiry: 1,
        },
      },
      {
        $sort: {
          expiry: 1,
        },
      },
    ]);

    if (data.length === 0) {
      return res.status(404).send({
        status: 0,
        message: "No ration found.",
        data: data,
      });
    }

    let result = [];

    data.reduce((acc, currObj) => {
      if (currObj.expiry) {
        acc = {
          ...currObj,
          expairedIn: moment(currObj.expiry).startOf().fromNow(),
        };
      } else {
        acc = { ...currObj };
      }
      result.push(acc);
    }, {});

    let NonExpaired = result.filter((obj, idx) => {
      if (!obj.expiry || obj.packetType === "Water") {
        delete result[idx];
        delete obj.expiry
        delete obj.packetContent
        delete obj.expairedIn
        return obj
      }




      if (obj.expairedIn && obj.expairedIn.toString().split(" ")[2] !== "ago") {
        delete result[idx];
        return obj;
      }
    });

    let expaired = result.filter((ele) => {
      if (ele) return ele;
    });


    let NonExpairedFood = NonExpaired.filter((ele) => { if (ele.packetType === "Food") return ele });

    let NonExpairedWater = NonExpaired.filter((ele) => { if (ele.packetType === "Water") return ele })

    NonExpairedWater.sort(function (a, b) {
      var keyA = a.qty;
      var keyB = b.qty;
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });


    return res.status(200).send({
      status: 1,
      message: "All ration.",
      expaired,
      NonExpaired: { NonExpairedWater: NonExpairedWater.reverse(), NonExpairedFood },
    });
  } catch (error) {
    return res
      .status(500)
      .send({ status: 0, message: error.message, data: "" });
  }
});

router.delete("/delete_ration", async (req, res) => {
  try {
    let set_is_active = false
    if (Object.keys(req.body).length === 0) {
      return res.status(400).send({
        status: 0,
        message: "Please provide data.",
        data: "",
      });
    }

    const { id, is_active } = req.body;

    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "Please provide id.",
        data: "",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: 0,
        message: "Please provide valid id.",
        data: "",
      });
    }


    if ("is_active" in req.body) {
      if (typeof is_active != "boolean") {
        return res.status(400).send({
          status: 0,
          message: "Please provide is_active value in boolean.",
          data: "",
        });
      }
      set_is_active = is_active
    }

   
    const data = await Ration.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          is_active: set_is_active,
        },
      },
      {
        new: true,
      }
    );

    if (!data) {
      return res.status(404).send({
        status: 0,
        message: "Ration not found.",
        data: "",
      });
    }

    return res.status(200).send({
      status: 1,
      message: "Ration deleted successfully.",
      data: data,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ status: 0, message: error.message, data: "" });
  }
});

router.get("/sedule_ration", async (req, res) => {
  try {
    let data = await Ration.aggregate([
      {
        $match: {
          is_active: true,
        },
      },
      {
        $project: {
          _id: 0,
          packetId: 1,
          packetType: 1,
          packetContent: 1,
          qty: 1,
          expiry: 1,
        },
      },
      {
        $sort: {
          expiry: 1,
        },
      },
    ]);

    if (data.length === 0) {
      return res.status(404).send({
        status: 0,
        message: "No ration found.",
        data: data,
      });
    }

    let result = [];

    data.reduce((acc, currObj) => {
      if (currObj.expiry) {
        acc = {
          ...currObj,
          expairedIn: moment(currObj.expiry).startOf().fromNow(),
        };
      } else {
        acc = { ...currObj };
      }
      result.push(acc);
    }, {});


    let NonExpaired = result.filter((obj, idx) => {
      if (!obj.expiry || obj.packetType === "Water") {
        delete result[idx];
        delete obj.expiry
        delete obj.packetContent
        delete obj.expairedIn
        return obj
      }

      if (obj.expairedIn && obj.expairedIn.toString().split(" ")[2] !== "ago") {
        delete result[idx];
        return obj;
      }
    });


    let NonExpairedFood = NonExpaired.filter((ele) => { if (ele.packetType === "Food") return ele });

    let NonExpairedWater = NonExpaired.filter((ele) => { if (ele.packetType === "Water") return ele })

    NonExpairedWater.sort(function (a, b) {
      var keyA = a.qty;
      var keyB = b.qty;
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });

    let sedule = []

    for (let i = 0; i < NonExpairedWater.length;) {
      let waterSed = []
      if (Number(NonExpairedWater[i].qty.toString().split(" ")[0]) === 1) {
        if (Number(NonExpairedWater[i + 1].qty.toString().split(" ")[0]) === 1) {
          waterSed.push(NonExpairedWater[i])
          waterSed.push(NonExpairedWater[i])
          sedule.push(waterSed)
          i++
          i++
        } else {
          i++
        }
      }
      else {
        waterSed.push(NonExpairedWater[i])
        sedule.push(waterSed)
        i++
      }
    }

    // const recursiveSumOf2500 = (
    //   NonExpairedFood,
    //   remainingSum,
    //   finalCombinations = [],
    //   currentCombination = [], 
    //   startFrom = 0,
    // ) => {
    //   if (remainingSum < 0) {
    //     return finalCombinations;
    //   }
    //   if (remainingSum === 0) {
    //     finalCombinations.push(currentCombination.slice());
    //     return finalCombinations;
    //   }
    //   for (let foodIndex = startFrom; foodIndex < NonExpairedFood.length; foodIndex++) {
    //     const currentFood = NonExpairedFood[foodIndex];
    //     currentCombination.push(currentFood);
    //     recursiveSumOf2500(
    //       NonExpairedFood,
    //       remainingSum - Number(NonExpairedFood[foodIndex].qty.toString().split(" ")[0]),
    //       finalCombinations,
    //       currentCombination,
    //       foodIndex,
    //     );
    //     currentCombination.pop();
    //   }
    //   return finalCombinations;
    // }
    // let y = recursiveSumOf2500(NonExpairedFood, 2500);

    let foodSed = []

    const targetSum = (arr, currIdx, set, setSum, target) => {
      if (currIdx === arr.length) {
        if (setSum === target) {
          foodSed.push(set)
        }
        return
      }
      targetSum(arr, currIdx + 1, [...set, arr[currIdx]], setSum + Number(arr[currIdx].qty.toString().split(" ")[0]), target)
      targetSum(arr, currIdx + 1, [...set], setSum, target)
    }

    targetSum([...NonExpairedFood], 0, [], 0, 2500)

    return res.status(200).send({
      status: 1,
      message: "All ration.",
      waterSedule: sedule,
      foodSedule: foodSed
    });
  } catch (error) {
    return res
      .status(500)
      .send({ status: 0, message: error.message, data: "" });
  }
});

module.exports = router;
