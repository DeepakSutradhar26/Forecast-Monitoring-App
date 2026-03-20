import { NextResponse } from "next/server";

export async function GET(req:Request){
    try{
        // Read the params
        const {searchParams} = new URL(req.url);

        const start = searchParams.get("start");
        const end = searchParams.get("end");
        const horizon = Number(searchParams.get("horizon"));

        if(!start || !end){
            return NextResponse.json({
                message : "Start date or end Date missing",
                status : 400,
            });
        }

        // Set publish and settlement date and time
        const startDateTime = new Date(start);
        const endDateTime = new Date(end);

        const publishDateFrom = new Date(startDateTime);
        publishDateFrom.setHours(publishDateFrom.getHours() - horizon);

        const publishDateTo = new Date(endDateTime);
        publishDateTo.setHours(publishDateTo.getHours() - horizon);

        const publishDateTimeFrom = publishDateFrom.toISOString();
        const publishDateTimeTo = publishDateTo.toISOString();

        const settlementDateFrom = start.split("T")[0];
        const settlementDateTo = end.split("T")[0];

        // Create params as required for api
        const paramsFuel = new URLSearchParams([
            ["settlementDateFrom", settlementDateFrom],
            ["settlementDateTo", settlementDateTo],
            ["fuelType", "WIND"]
        ]); 

        const paramsWind = new URLSearchParams([
            ["publishDateTimeFrom", publishDateTimeFrom],
            ["publishDateTimeTo", publishDateTimeTo],
        ]);

        const FUEL_URL = `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?${paramsFuel.toString()}`;
        const WIND_URL = `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?${paramsWind.toString()}`;

        // Raw data of actual and generated forecast
        const [actualData, generatedData] = await Promise.all([
            fetch(FUEL_URL),
            fetch(WIND_URL),
        ]);

        const actualJson = await actualData.json();
        const generatedJson = await generatedData.json();

        return NextResponse.json({
            actual : actualJson,
            generated : generatedJson,
            status : 200,
        });
    }catch(err:any){
        return NextResponse.json({
            error : err.message,
            status : 500,
        });
    }
}