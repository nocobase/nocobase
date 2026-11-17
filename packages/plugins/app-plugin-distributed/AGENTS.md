# Distributed plugin guidance

This package contains only Agent Skills and documentation. Follow the repository's `AGENTS.md` and plugin development Skill when maintaining it. Do not introduce Client, Server or CLI entry points, runtime dependencies or a `distributed` configuration section as part of editing this guidance.

Keep `skills/nocobase-app-plugin-distributed/SKILL.md` focused on application tasks, with detailed guidance in its directly linked references. Verify configuration shapes against current source and installed public contracts. Commercial adapter options belong to the compatible runtime packages; do not invent options or imply this public package includes their implementations or licenses.

Write published documentation in English, with each prose paragraph on one physical line. Update the changeset when changing published Skills. Validate package contents and relative links; no build or runtime tests are needed for a documentation-only package.
