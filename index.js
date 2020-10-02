require('dotenv').config()
const rp = require('request-promise')
const fs = require('fs')
const tripsJSON = require('./trips.json')
const GMAPSAPI = require('./GoogleMapsAPI')

const options = {
	method: 'POST',
	uri: 'https://riders.uber.com/api/getTripsForClient',
	headers: {
		'content-type': 'application/json',
		'x-csrf-token': process.env.UBER_TOKEN,
		'cookie': process.env.UBER_COOKIE
	},
}
const requestBody = {
	offset: "0",
	limit: "50",
	range: {
		fromTime: null,
		toTime: null
	},
	tenancy: "uber/production"
}

let trips = []

async function getAllUberTrips(offset) {
	if (offset) requestBody.offset = offset

	options.body = JSON.stringify(requestBody)
	await rp(options).then(async response => {
		const data = JSON.parse(response)
		trips = trips.concat(data.data.trips.trips)
		if (data.data.trips.pagingResult.hasMore) {
			await getAllUberTrips(data.data.trips.pagingResult.nextCursor)
		}
	})
}

(async function () {
	if (tripsJSON) {
		trips = tripsJSON
	} else {
		await getAllUberTrips()
		fs.writeFileSync('trips.json', JSON.stringify(trips))
	}
	let maxTrip = 0
	const moneySpentInTotal = trips.reduce((acc, cur) => {
		acc += cur.clientFare
		if (maxTrip < cur.clientFare) maxTrip = cur.clientFare
		return acc
	}, 0)
	const distance = await GMAPSAPI.getDistance(trips[4].begintripFormattedAddress,trips[4].dropoffFormattedAddress)

	console.log('distance:',JSON.stringify(distance.json.rows[0]))
	console.log(`Total money spent: ${moneySpentInTotal} RON`)
	console.log(`Most money spent on a single trip: ${maxTrip} RON`)
	console.log('Total time spent in uber:', getTotalTimeSpentInUber(trips), 'days')
})()

function getTotalTimeSpentInUber(trips) {
	return trips.reduce((acc, cur) => {
		if (cur.dropoffTime == null || cur.requestTime == null) return acc
		const time = (new Date(cur.dropoffTime) - new Date(cur.requestTime)) / 1000 / 60 / 60 / 24
		return acc + time
	}, 0)
}