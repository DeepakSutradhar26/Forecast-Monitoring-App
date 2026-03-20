"use client"

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function convertToISO(date:string,time:number){
    let hour = String(time);
    if(hour.length < 2) hour = String(0).concat(hour);
    return `${date}T${hour}:00:00Z`;
}

export default function Dashboard(){
    const [startDate, setStartDate] = useState("2025-01-02");
    const [startTime, setStartTime] = useState(0);

    const [endDate, setEndDate] = useState("2025-01-03");
    const [endTime, setEndTime] = useState(0);

    const [horizon, setHorizon] = useState(4);

    const [data, setData] = useState();

    useEffect(()=>{
        async function fetchData(){
            const data = await fetch(`/api/wind-data?start=${convertToISO(startDate,startTime)}&end=${convertToISO(endDate,endTime)}&horizon=${horizon}`);
            const res = await data.json();
            setData(res);
            console.log(res);
        }
        fetchData();
    },[startTime, endTime, horizon]);

    return (
        <>
        </>
    );
}