import React, { Fragment } from 'react'
import { isFn } from '@formily/shared'

type ReactRenderPropsChildren<T = any> =
  | React.ReactNode
  | ((props: T) => React.ReactElement)

interface IPasswordStrengthProps {
  value?: React.ReactText
  children?: ReactRenderPropsChildren<number>
}

const isNum = function (c) {
  return c >= 48 && c <= 57
}
const isLower = function (c) {
  return c >= 97 && c <= 122
}
const isUpper = function (c) {
  return c >= 65 && c <= 90
}
const isSymbol = function (c) {
  return !(isLower(c) || isUpper(c) || isNum(c))
}
const isLetter = function (c) {
  return isLower(c) || isUpper(c)
}

const getStrength = (val) => {
  if (!val) return 0
  let num = 0
  let lower = 0
  let upper = 0
  let symbol = 0
  let MNS = 0
  let rep = 0
  let repC = 0
  let consecutive = 0
  let sequential = 0
  const len = () => num + lower + upper + symbol
  const callme = () => {
    let re = num > 0 ? 1 : 0
    re += lower > 0 ? 1 : 0
    re += upper > 0 ? 1 : 0
    re += symbol > 0 ? 1 : 0
    if (re > 2 && len() >= 8) {
      return re + 1
    } else {
      return 0
    }
  }
  for (let i = 0; i < val.length; i++) {
    const c = val.charCodeAt(i)
    if (isNum(c)) {
      num++
      if (i !== 0 && i !== val.length - 1) {
        MNS++
      }
      if (i > 0 && isNum(val.charCodeAt(i - 1))) {
        consecutive++
      }
    } else if (isLower(c)) {
      lower++
      if (i > 0 && isLower(val.charCodeAt(i - 1))) {
        consecutive++
      }
    } else if (isUpper(c)) {
      upper++
      if (i > 0 && isUpper(val.charCodeAt(i - 1))) {
        consecutive++
      }
    } else {
      symbol++
      if (i !== 0 && i !== val.length - 1) {
        MNS++
      }
    }
    let exists = false
    for (let j = 0; j < val.length; j++) {
      if (val[i] === val[j] && i !== j) {
        exists = true
        repC += Math.abs(val.length / (j - i))
      }
    }
    if (exists) {
      rep++
      const unique = val.length - rep
      repC = unique ? Math.ceil(repC / unique) : Math.ceil(repC)
    }
    if (i > 1) {
      const last1 = val.charCodeAt(i - 1)
      const last2 = val.charCodeAt(i - 2)
      if (isLetter(c)) {
        if (isLetter(last1) && isLetter(last2)) {
          const v = val.toLowerCase()
          const vi = v.charCodeAt(i)
          const vi1 = v.charCodeAt(i - 1)
          const vi2 = v.charCodeAt(i - 2)
          if (vi - vi1 === vi1 - vi2 && Math.abs(vi - vi1) === 1) {
            sequential++
          }
        }
      } else if (isNum(c)) {
        if (isNum(last1) && isNum(last2)) {
          if (c - last1 === last1 - last2 && Math.abs(c - last1) === 1) {
            sequential++
          }
        }
      } else {
        if (isSymbol(last1) && isSymbol(last2)) {
          if (c - last1 === last1 - last2 && Math.abs(c - last1) === 1) {
            sequential++
          }
        }
      }
    }
  }
  let sum = 0
  const length = len()
  sum += 4 * length
  if (lower > 0) {
    sum += 2 * (length - lower)
  }
  if (upper > 0) {
    sum += 2 * (length - upper)
  }
  if (num !== length) {
    sum += 4 * num
  }
  sum += 6 * symbol
  sum += 2 * MNS
  sum += 2 * callme()
  if (length === lower + upper) {
    sum -= length
  }
  if (length === num) {
    sum -= num
  }
  sum -= repC
  sum -= 2 * consecutive
  sum -= 3 * sequential
  sum = sum < 0 ? 0 : sum
  sum = sum > 100 ? 100 : sum

  if (sum >= 80) {
    return 100
  } else if (sum >= 60) {
    return 80
  } else if (sum >= 40) {
    return 60
  } else if (sum >= 20) {
    return 40
  } else {
    return 20
  }
}

export const PasswordStrength: React.FC<IPasswordStrengthProps> = (props) => {
  if (isFn(props.children)) {
    return props.children(getStrength(String(props.value)))
  } else {
    return <Fragment>{props.children}</Fragment>
  }
}
