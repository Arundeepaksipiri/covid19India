const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null
const initializeDBAndServer = async () => {
  try {
    app.listen(3000, () => {
      console.log('Starting server http://localhost:3000/')
    })
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}
initializeDBAndServer()
app.get('/states/', async (request, response) => {
  const stateQuery = `
  SELECT * FROM state ORDER BY state_Id`
  const stateArray = await db.all(stateQuery)
  const ans = state => {
    return {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    }
  }
  response.send(stateArray.map(eachState => ans(eachState)))
})
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `
  SELECT * FROM state WHERE state_id=${stateId}`
  const stateArray = await db.get(stateQuery)
  response.send({
    stateId: stateArray.state_id,
    stateName: stateArray.state_name,
    population: stateArray.population,
  })
})
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const districtQuery = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES
  (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  )`
  const districtArray = await db.run(districtQuery)
  response.send('District Successfully Added')
})
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtQuery = `
  SELECT * FROM district WHERE district_id=${districtId}`
  const districtArray = await db.get(districtQuery)
  response.send({
    districtId: districtArray.district_id,
    districtName: districtArray.district_name,
    stateId: districtArray.state_id,
    cases: districtArray.cases,
    cured: districtArray.cured,
    active: districtArray.active,
    deaths: districtArray.deaths,
  })
})
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtQuery = `
  DELETE FROM district WHERE district_id=${districtId}`
  await db.run(districtQuery)
  response.send('District Removed')
})
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const districtQuery = `
  UPDATE district 
  SET
  district_name='${districtDetails.districtName}',
  state_id=${districtDetails.stateId},
  cases=${districtDetails.cases},
  cured=${districtDetails.cured},
  active=${districtDetails.active},
  deaths=${districtDetails.deaths} WHERE district_id=${districtId}
  

  `
  await db.run(districtQuery)
  response.send('District Details Updated')
})
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `
  SELECT SUM(cases) as cases, SUM(cured) as cured, SUM(active) as active , sum(deaths) as deaths
  FROM district WHERE state_id=${stateId} GROUP BY state_id`
  const stateArray = await db.get(stateQuery)
  response.send({
    totalCases: stateArray.cases,
    totalCured: stateArray.cured,
    totalActive: stateArray.active,
    totalDeaths: stateArray.deaths,
  })
})
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const districtQuery = `
  SELECT * FROM state INNER JOIN district ON 
  state.state_id = district.state_id WHERE 
  district.district_id=${districtId}`
  const stateDetails = await db.get(districtQuery)
  response.send({
    stateName: stateDetails.state_name,
  })
})
module.exports = app
