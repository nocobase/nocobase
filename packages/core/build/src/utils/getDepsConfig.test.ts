import { winPath, getRltExternalsFromDeps, getDepsConfig, getDepPkgPath } from './getDepsConfig'

describe('getDepsConfig', () => {
  it('winPath', () => {
    expect(winPath('a\\b')).toEqual('a/b')
  })
})

