import styles from './CreateChatButton.module.css'

export type CreateChatButtonProps = {
	onClick: () => void
}

export function CreateChatButton({ onClick }: CreateChatButtonProps) {
	return (
		<button
			type='button'
			className={styles.btn}
			onClick={onClick}
			aria-label='Новый чат'
			title='Новый чат'
		>
			<svg
				className={styles.icon}
				viewBox='0 0 16 16'
				fill='none'
				stroke='currentColor'
				strokeWidth='2'
				strokeLinecap='round'
				aria-hidden='true'
			>
				<line x1='8' y1='2' x2='8' y2='14' />
				<line x1='2' y1='8' x2='14' y2='8' />
			</svg>
		</button>
	)
}