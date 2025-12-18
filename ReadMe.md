## OVERVIEW:

* This is a proof of concept for building an MCP (Model Context Protocol) server on top of naked `onesearch-api`
* it uses the https://mcp-framework.com tool which is for node.js



## TOOLS

* add a tool for (truly) simple search using `/simple?query=`
* add a tool for morelikethis
* add a tool for document fetch with `/content`
* add multiple tools for different browse scenarios
  * Specialty
  * Topic
  * PTopic
  * SubTopic
  * ArticleType
  * ArticleCategory
  * ArticleCategorySubheading
  * CME
* add a tool for exact phrase using `/advanced?exactPhrase=`
* add a tool for logical OR using `/advanced?atLeastOneWord=`

## MORE TODO

* authentication for attribution in monetization
* integrate with moesif for monetization https://www.moesif.com/blog/api-strategy/model-context-protocol/Monetizing-MCP-Model-Context-Protocol-Servers-With-Moesif/
