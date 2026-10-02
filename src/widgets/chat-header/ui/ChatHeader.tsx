import type { ConnectionStatus } from 'shared/types/domain'
import { chatInitial } from 'shared/lib/chatInitial'
import { statusLabel } from 'shared/lib/connection/statusLabel'
import { Phone, Video, Search } from 'lucide-react'
import styles from './ChatHeader.module.css'

export type ChatHeaderProps = {
	title: string
	chatId: string
	status: ConnectionStatus
	onLeave: () => void
}

export function ChatHeader({
	title,
	chatId,
	status,
	onLeave,
}: ChatHeaderProps) {
	const visibleStatus: ConnectionStatus =
		status === 'idle' ? 'connecting' : status
	return (
		<div className={styles.bar}>
			<button
				type='button'
				className={styles.back}
				onClick={onLeave}
				aria-label='Назад'
				title='Назад'
			>
				←
			</button>
			<div className={styles.avatar} aria-hidden='true'>
				{chatInitial(title)}
			</div>
			<div className={styles.meta}>
				<h2 className={styles.title}>{title || chatId}</h2>
				<div className={styles.subtitle}>
					<span className={`${styles.status} ${styles[visibleStatus]}`}>
						<span className={styles.dot} />
						{statusLabel(visibleStatus)}
					</span>
				</div>
			</div>
			<div className={styles.actions}>
				<button type='button' className={styles.iconBtn} aria-label='Позвонить'>
					<Phone size={15} strokeWidth={1.5} aria-hidden='true' />
				</button>
				<button
					type='button'
					className={styles.iconBtn}
					aria-label='Видеозвонок'
				>
					<Video size={20} strokeWidth={1.5} aria-hidden='true' />
				</button>
				<button type='button' className={styles.iconBtn} aria-label='Поиск'>
					<Search size={20} strokeWidth={1.5} aria-hidden='true' />
				</button>
			</div>
		</div>
	)
}
