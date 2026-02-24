// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify()

import { globSync } from "glob"

// constants
const baseURL = "https://files.feederbox.cc/share/Lurking987/Adobe%20Transparent%20Edits/"
const FILES_PATH = "/home/stash/serve/fb/share/Lurking987/Adobe Transparent Edits/**"
const errorMessage = {
  endpoint: "https://lurking.feederbox.cc/graphql",
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJhbm9ueW1vdXMiLCJzdWIiOiJBUElLZXkiLCJpYXQiOjB9.WwPu6uCOqRAtz_1WL_tqI5tae2ZhIxdqt4ZMj0pEnGI"
}
// responses
const identityResponse = { data: { me: { name: "anonymous" }}}
const emptyPerformer = { data: { searchPerformer: [] }}

// scrape filesnames from glob
const files = globSync(FILES_PATH)
const fileNames = files.map(file => file.split("/").pop())

// handle performerResponse
const performerResponse = (matches) => {
  const performers = matches.map(match => ({
    name: match.replace(/\.webp/, ""),
    images: [{ url: `${baseURL}/${match}` }],
    measurements: {},
    id: match.replace(/\.webp/, "")
  }))
  return { data: { searchPerformer: performers } }
}

fastify.post('/graphql', async (request, reply) => {
  // try reading json body
  const operation = request.body?.operationName
  if (operation == "Me") return identityResponse
  else if (operation == "SearchPerformer") {
    const term = request.body?.variables?.term
    if (!term) return emptyPerformer
    // find all matching images
    const matches = fileNames.filter(name => name.startsWith(term))
    if (!matches.length) return emptyPerformer
    return performerResponse(matches)
  } else {
    // return empty body with operation
    const body = {}
    body[operation] = {}
    return body
  }
})

fastify.get('/', async function handler (request, reply) { return errorMessage })

// redirect /performers to the image
fastify.get('/performers/:id', async function handler (request, reply) {
  const id = decodeURI(request.params.id)
  if (fileNames.includes(`${id}.webp`)) {
    return reply.redirect(`${baseURL}/${id}.webp`)
  } else {
    return reply.code(404).send({ error: "Performer not found" })
  }
})

// Run the server!
try {
  await fastify.listen({ port: 10103 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}