import React, { useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import QRCode from "qrcode.react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3000/api";

const drinkPrices = {
  蒲種烏龍: 30,
  日月潭紅茶: 30,
  仙草奶茶: 35,
  冬瓜茶: 25,
  甘蔗青茶: 35,
  一芳水果茶: 40,
  百香果綠茶: 35,
  黑糖珍珠鮮奶: 40,
  紅豆黑茶: 35,
  養樂多青茶: 35,
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

function App() {
  const [orders, setOrders] = useState([]);
  const [timeLeft, setTimeLeft] = useState(1700);
  const [totalSpent, setTotalSpent] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    drink: "",
    size: "中杯",
    ice: "正常冰",
    sugar: "100%",
  });

  const fetchData = useCallback(async () => {
    console.log("Fetching data from server...");
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Received data from server:", data);
      setOrders(data.orders);
      setTotalSpent(data.totalSpent);
      setTimeLeft(data.timeLeft);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Fetch every 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  const updateServerTime = useCallback(
    debounce(async (newTime) => {
      console.log(`Updating server time to ${newTime}`);
      try {
        const response = await fetch(`${API_URL}/orders`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeLeft: newTime }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Time updated successfully:", data);
      } catch (error) {
        console.error("Error updating time:", error);
      }
    }, 5000),
    []
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime > 0 ? prevTime - 1 : 0;
        updateServerTime(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [updateServerTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timeLeft === 0) return;

    const drinkName = formData.drink.split(" ")[0];
    const price = drinkPrices[drinkName] + (formData.size === "大杯" ? 5 : 0);

    const newOrder = { ...formData, price };
    console.log("Submitting new order:", newOrder);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Order submitted successfully:", data);

      // Fetch updated data after submitting order
      fetchData();

      setFormData({ ...formData, name: "", drink: "" });
    } catch (error) {
      console.error("Error submitting order:", error);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const chartData = {
    labels: Object.keys(drinkPrices),
    datasets: [
      {
        label: "訂單數量",
        data: Object.keys(drinkPrices).map(
          (drink) =>
            orders.filter((order) => order.drink.includes(drink)).length
        ),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y",
    scales: {
      x: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#4a4a4a" }}>
        一芳台灣水果茶員工訂單表格
      </h1>
      <div
        style={{
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "bold",
          margin: "20px 0",
        }}
      >
        剩餘時間:{" "}
        <span>{timeLeft > 0 ? formatTime(timeLeft) : "時間到！"}</span>
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "bold",
          margin: "20px 0",
        }}
      >
        總消費: ¥<span>{totalSpent}</span>
      </div>

      {timeLeft > 0 && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#f9f9f9",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <label style={{ display: "block", marginTop: "10px" }}>
            姓名：
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </label>

          <label style={{ display: "block", marginTop: "10px" }}>
            選擇飲品：
            <select
              name="drink"
              value={formData.drink}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <option value="">請選擇飲品</option>
              {Object.entries(drinkPrices).map(([drink, price]) => (
                <option key={drink} value={`${drink} (¥${price})`}>
                  {drink} (¥{price})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "block", marginTop: "10px" }}>
            杯型：
            <select
              name="size"
              value={formData.size}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <option value="中杯">中杯</option>
              <option value="大杯">大杯 (+¥5)</option>
            </select>
          </label>

          <label style={{ display: "block", marginTop: "10px" }}>
            冰量：
            <select
              name="ice"
              value={formData.ice}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <option value="正常冰">正常冰</option>
              <option value="少冰">少冰</option>
              <option value="去冰">去冰</option>
            </select>
          </label>

          <label style={{ display: "block", marginTop: "10px" }}>
            甜度：
            <select
              name="sugar"
              value={formData.sugar}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <option value="100%">100%</option>
              <option value="75%">75%</option>
              <option value="50%">50%</option>
              <option value="25%">25%</option>
              <option value="無糖">無糖</option>
            </select>
          </label>

          <input
            type="submit"
            value="提交訂單"
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          />
        </form>
      )}

      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <QRCode value="https://masterconcept.ai" />
      </div>

      <div style={{ width: "100%", height: "400px", margin: "20px auto" }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <h2 style={{ textAlign: "center", color: "#4a4a4a" }}>已提交的訂單</h2>
      <div style={{ borderTop: "1px solid #ddd", paddingTop: "20px" }}>
        {orders.map((order, index) => (
          <p key={index}>
            {order.name}: {order.drink} ({order.size}, {order.ice},{" "}
            {order.sugar}) - ¥{order.price}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;