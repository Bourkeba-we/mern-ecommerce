import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";

export const getAnalytics = async (req, res) => {
  try {
    const analyticsData = await getAnalyticsData();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const dailySalesData = await getDailySalesData(startDate, endDate);

    res.status(200).json({ analyticsData, dailySalesData });
  } catch (error) {
    console.error("Error in getAnalytics controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const getAnalyticsData = async () => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});

    const salesData = await Order.aggregate([
      {
        $group: {
          _id: null, // group all documents together
          totalSales: { $sum: 1 }, // sum 1 for each document
          totalRevenue: { $sum: "$totalAmount" }, // sum totalAmount field for each document
        },
      },
    ]);

    const { totalSales, totalRevenue } = salesData[0] || {
      totalSales: 0,
      totalRevenue: 0,
    }; // if salesData[0] is undefined, set default values

    return {
      users: totalUsers,
      products: totalProducts,
      totalSales,
      totalRevenue,
    };
  } catch (error) {
    console.error("Error in getAnalyticsData controller: ", error.message);
    return { message: "Internal Server Error", error: error.message };
  }
};

const getDailySalesData = async (startDate, endDate) => {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          orderStatus: "completed",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dateArray = await getDateInRange(startDate, endDate);

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date);

      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
  } catch (error) {
    console.error("Error in getDailySalesData controller: ", error.message);
    return { message: "Internal Server Error", error: error.message };
  }
};

const getDateInRange = async (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate.toISOString().split("T")[0])); // get only the date part
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
