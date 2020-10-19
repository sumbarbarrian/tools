const fs = require('fs')
const path = require('path')
const glob = require('glob')
const util = require('util')
const cla = require('command-line-args')
const { readFile , writeFile } = fs.promises

const claDefs = [{
  name: 'src', alias: 's', defaultOption:true, multiple: true
}]

const { src = [] } = cla(claDefs)

/**
 * removes all desc tags
 */
const cleanDesc = src => src.replace(/^\s*<desc>.*?<\/desc>\s*$/gm, '')

/**
 * removes all "id" tags
 */
const cleanIds = src => src.replace(/\s*id="[^"]*"/g, '')

/**
 * get list of  all "svg" files
 */
const getSvgFiles = async folder => {
  if (folder.endsWith('.svg')) {
    return [folder]
  } else {
    return util.promisify(glob)(`${folder}/**/*.svg`)
  }

}


const run = async () => {
  const all = src.map( getSvgFiles )
  let ok = 0;
  const files = (await Promise.all(all)).reduce( (all, list) => [...all, ...list] , [])
  const result = ( await Promise.all(
    files
      .map( async file => {
        try {
          let src = await readFile(file)
          src = String(src)
          src = cleanDesc(src)
          src = cleanIds(src)
          await writeFile(file, src)
          return { status: 0, filename: file }
        } catch ( e ) {
          return { status: 1, filename: file, error: e }
        }
      })
    )
  )
  .filter( ({ status }) => {
    let res = status === 0
    if (res) {
      ok++
      return false
    }
    return true
  })
  .map( ({ filename, error }) => `${filename} : ${error.message}` )
  console.info(`${files.length} selected`)
  console.info('Result:')
  console.info(`  ${ok} files done`)
  console.info(`  ${result.length} have errors`)
  console.error( result.join('\n') )
}

run().catch( e => {
  console.error(e)
})
