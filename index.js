import airtableJson from 'airtable-json'
import fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config()


const content = await airtableJson({
  auth_key: process.env.AUTH_KEY, // this is your airtable api key, starting with 'key'
  base_name: process.env.BASE_NAME, // this is the base api key, which starts with 'app'
  primary: "Content", // this is the table name you want to pull
  view: "Main" // this is the view you want to pull
})

for (let i = 0; i < content.length; i++) {
  //Delete the ID field that AirTable uses
  delete content[i].__id

  //Delete non approved items
  if (!content[i].approved) {
    content.splice(i, 1)
  }
}


let data = JSON.stringify(content);
fs.writeFileSync('Content.json', data);