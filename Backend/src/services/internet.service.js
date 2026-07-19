import {tavily as Tavily} from '@tavily/core'
import { json } from 'zod'

const tavily= Tavily({
    apiKey:process.env.TAVILY_API_KEY
})

export const searchInternet= async({query})=>{
      console.log("🔍 Tavily search triggered:", query);
    const results= await tavily.search(query,{
      maxResults:5,
      searchDepth:"advanced"
    })
    return JSON.stringify(results)
}