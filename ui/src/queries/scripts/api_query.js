import axios from 'axios'
import { interpolateForQueryParams, titleize } from 'utils/scripts/string'

function loadApiQuery (query, variables) {
  const [apiPath, queryParams] = interpolateForQueryParams(query.preferences.api_path, variables)

  for (const key in queryParams) {
    if (!queryParams[key]) {
      delete queryParams[key]
    }
  }

  return axios.get(apiPath, {
    params: queryParams
  }).then((result) => {
    if (typeof result.data === 'object') {
      const data = fetchRowsFromsApi(result.data?.data || result.data)
      const columns = buildColumnsForData(
        result.data?.data || result.data,
        result.data.meta?.columns || result.data.data?.columns || result.data?.columns
      )

      return { data, columns }
    } else {
      return { dataHTML: result.data }
    }
  })
}

function buildColumnsForData (data, columns) {
  if (columns) {
    return columns.map((column) => {
      return {
        name: column.name || column.title || column.label,
        display_name: titleize(column.display_name || column.label || column.title || column.name),
        column_type: column.column_type || column.type,
        is_array: column.is_array
      }
    })
  } else {
    let foundData

    if (Array.isArray(data)) {
      foundData = data
    } else {
      foundData = data[Object.keys(data)[0]]
    }

    if (foundData[0]) {
      return Object.keys(foundData[0]).map((key) => {
        const notNullColumn = foundData.find((acc, row) => (row[key] !== null) || {})[key]

        return {
          name: key,
          display_name: titleize(key),
          column_type: fetchTypeForColumnValue(notNullColumn),
          is_array: Array.isArray(notNullColumn)
        }
      })
    } else {
      return []
    }
  }
}

function fetchTypeForColumnValue (value) {
  if (Array.isArray(value)) {
    return fetchTypeForColumnValue(value[0])
  } else if (value instanceof Date) {
    return 'datetime'
  } else if (typeof value === 'number') {
    return 'float'
  } else if (value === true || value === false) {
    return 'boolean'
  } else if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return 'datetime'
    } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return 'date'
    } else {
      return 'string'
    }
  }
}

function fetchRowsFromsApi (data) {
  let foundData

  if (Array.isArray(data)) {
    foundData = data
  } else {
    foundData = data[Object.keys(data)[0]]
  }

  if (foundData) {
    if (Array.isArray(foundData[0])) {
      return foundData
    } else {
      return foundData.map((row) => Object.values(row))
    }
  } else {
    return []
  }
}

export { loadApiQuery }
