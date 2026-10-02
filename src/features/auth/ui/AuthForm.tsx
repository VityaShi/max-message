import { useState } from 'react'
import type { Credentials } from 'shared/types/greenApi'
import { useAuth } from '../model/useAuth'
import styles from './AuthForm.module.css'

export type AuthFormProps = {
	onSubmit: (creds: Credentials) => void
}

export function AuthForm({ onSubmit }: AuthFormProps) {
	const [idInstance, setIdInstance] = useState('')
	const [apiTokenInstance, setApiTokenInstance] = useState('')
	const { submit, error, clear } = useAuth()

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		const creds = submit(idInstance, apiTokenInstance)
		if (creds) onSubmit(creds)
	}

	return (
		<form className={styles.wrap} onSubmit={handleSubmit} noValidate>
			<h1 className={styles.title}>MAX-чат</h1>
			<p className={styles.subtitle}>Войдите через GREEN-API</p>

			<div className={styles.field}>
				<label className={styles.label} htmlFor='idInstance'>
					idInstance
				</label>
				<input
					id='idInstance'
					className={styles.input}
					type='text'
					inputMode='numeric'
					autoComplete='off'
					placeholder='например, 1103xxxxxx'
					value={idInstance}
					onChange={e => {
						setIdInstance(e.target.value)
						clear()
					}}
				/>
			</div>

			<div className={styles.field}>
				<label className={styles.label} htmlFor='apiTokenInstance'>
					apiTokenInstance
				</label>
				<input
					id='apiTokenInstance'
					className={styles.input}
					type='text'
					autoComplete='off'
					placeholder='токен из личного кабинета'
					value={apiTokenInstance}
					onChange={e => {
						setApiTokenInstance(e.target.value)
						clear()
					}}
				/>
			</div>

			{error && <div className={styles.error}>{error}</div>}

			<button type='submit' className={styles.button}>
				Подключиться
			</button>

			<div className={styles.hint}>
				Получите <strong>idInstance</strong> и <strong>apiTokenInstance</strong>{' '}
				в{' '}
				<a
					href='https://console.green-api.com'
					target='_blank'
					rel='noreferrer noopener'
				>
					консоли GREEN-API
				</a>
				. Перед первым подключением отсканируйте QR-код в MAX — приложение не
				делает это за вас.
			</div>
		</form>
	)
}
