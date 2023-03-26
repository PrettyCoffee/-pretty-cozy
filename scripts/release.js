#!/usr/bin/env node

const { execSync } = require("child_process")

const pkg = require("../package.json")

const argNotAvailable = arg => {
  console.log(`Error: ${arg} is not available\n`)
}

const parseVersion = version => {
  const matchVersion = /v?(\d+)\.(\d+)\.(\d+)(?:-alpha\.(\d+))?/
  const [, major, minor, patch, alpha] = matchVersion
    .exec(version)
    .map(value => {
      const number = Number(value)
      return Number.isNaN(number) ? value : number
    })
  return { major, minor, patch, alpha }
}

const getOptions = args =>
  args.reduce((options, arg) => {
    switch (arg) {
      case "--major":
      case "--minor":
      case "--patch":
        return { ...options, scope: arg.replace("--", "") }

      case "-p":
      case "--pre":
        return { ...options, pre: true }

      default:
        argNotAvailable(arg)
        return options
    }
  }, {})

const increaseVersion = ({ major, minor, patch }, scope) =>
  scope === "major"
    ? { major: major + 1, minor: 0, patch: 0 }
    : scope === "minor"
    ? { major, minor: minor + 1, patch: 0 }
    : { major, minor, patch: patch + 1 }

const createVersion = ({ scope, pre }) => {
  const version = parseVersion(pkg.version)
  const newVersion = increaseVersion(version, scope)

  if (pre) {
    if (version.alpha != null) return { ...version, alpha: version.alpha + 1 }

    return { ...newVersion, alpha: 0 }
  }

  if (version.alpha != null) return { ...version, alpha: undefined }

  return newVersion
}

const stringifyVersion = ({ major, minor, patch, alpha }) =>
  alpha != null
    ? `${major}.${minor}.${patch}-alpha.${alpha}`
    : `${major}.${minor}.${patch}`

const applyVersion = version => {
  execSync(`npm --no-git-tag-version version ${version} --workspaces`)
  execSync(`npm --no-git-tag-version version ${version}`)
}

const run = () => {
  const args = process.argv.slice(2)
  const options = getOptions(args)

  const version = stringifyVersion(createVersion(options))
  console.log(pkg.version, "->", version)

  applyVersion(version)
}

run()