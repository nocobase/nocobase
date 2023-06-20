import React from "react";

const LangSwitch = () => {
  const { hostname } = window.location
  if (hostname === 'localhost') return null;
  const en = window.location.href.replace(hostname, 'docs.nocobase.com')
  const cn = window.location.href.replace(hostname, 'docs-cn.nocobase.com')
  return <span><a href={en}>EN</a> | <a href={cn}>中文</a></span>
}

export default LangSwitch;
