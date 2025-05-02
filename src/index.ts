import { Elysia } from 'elysia'
import { api } from './api'

new Elysia()
  .use(api)
  .get('/', 'hey')
  .listen(3000)

console.log(`🦊 Elysia is running at http://localhost:3000`)
