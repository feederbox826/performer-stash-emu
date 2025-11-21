// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify()

import { fileNames } from './files.js'

// constants
const baseURL = "https://files.feederbox.cc/share/Lurking987/Adobe%20Transparent%20Edits/"
const errorMessage = {
  endpoint: "https://lurking.feederbox.cc/graphql",
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJhbm9ueW1vdXMiLCJzdWIiOiJBUElLZXkiLCJpYXQiOjB9.WwPu6uCOqRAtz_1WL_tqI5tae2ZhIxdqt4ZMj0pEnGI"
}
// responses
const identityResponse = { data: { me: { name: "anonymous" }}}
const emptyPerformer = { data: { searchPerformer: [] }}

// handle performerResponse
const performerResponse = (matches) => {
  const images = matches.map(filename => ({
    url: `${baseURL}/${filename}`
  }))
  const aliases = matches.map(name => name.replace(/( v\d)?\.png/, ""))
  return {
    data: { searchPerformer: [{
      name: aliases[0],
      aliases: [... new Set(aliases)],
      images: images,
      measurements: {}
    }]}
  }
}

fastify.post('/graphql', async (request, reply) => {
  // try reading json body
  const operation = request.body?.operationName
  if (operation == "Me") return identityResponse
  else if (operation == "SearchPerformer") {
    const term = request.body?.variables?.term
    // find all matching images
    const matches = fileNames.filter(name => name.startsWith(term))
    if (!matches.length) return emptyPerformer
    return performerResponse(matches)
  } else {
    return errorMessage
  }
})

// Declare a route
fastify.get('/', async function handler (request, reply) { return errorMessage })

// Run the server!
try {
  await fastify.listen({ port: 10103 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}