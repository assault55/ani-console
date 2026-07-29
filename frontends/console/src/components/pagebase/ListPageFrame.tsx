import type { ReactNode } from 'react'
import styles from './pagebase.module.css'

type ListPageHeaderProps = {
  iconClassName: string
  title: string
  subtitle?: string
  extra?: ReactNode
}

export function ListPageHeader({ iconClassName, title, subtitle, extra }: ListPageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderIcon} aria-hidden="true">
        <i className={`iconfont ${iconClassName}`} />
      </div>
      <div className={styles.pageHeaderTitleArea}>
        <h1 className={styles.pageHeaderTitle}>{title}</h1>
        {subtitle ? <p className={styles.pageHeaderSubtitle}>{subtitle}</p> : null}
      </div>
      {extra ? <div className={styles.pageHeaderExtra}>{extra}</div> : null}
    </header>
  )
}

type ListPageFrameProps = {
  header: ReactNode
  tabs?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

export function ListPageFrame({ header, tabs, toolbar, children }: ListPageFrameProps) {
  return (
    <div className={styles.page}>
      {header}
      <section className={styles.contentPanel}>
        {tabs}
        {toolbar}
        {children}
      </section>
    </div>
  )
}
