const googleMapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_MATRIX_KEY
})

function getDistance(origin, destination) {
    return new Promise((resolve, reject) => {
        googleMapsClient.distanceMatrix({
            origins: origin,
            destinations: destination
        }, (err, response) => {
            if (!err) {
                resolve(response)
            } else {
                reject(err)
            }
        })
    })
}
module.exports = {
    getDistance
}