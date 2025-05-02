import { Elysia } from 'elysia'
import { apollo, gql } from '@elysiajs/apollo'

export const graphql = new Elysia({ name: 'graphql' })
	.use(
		apollo({
			typeDefs: gql`
				type Book {
					title: String
					author: String
				}

				type Query {
					books: [Book]
				}
			`,
			resolvers: {
				Query: {
					books: () => {
						return [
							{
								title: 'Elysia',
								author: 'saltyAom'
							}
						]
					}
				}
			}
		})
	)
  .get('/', () => {
    return await apollo()
  })