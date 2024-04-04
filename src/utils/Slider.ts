import Timeout from './Timeout';

export default class Slide {
	public container;
	public slides;
	public controls;
	public timer;

	public activeIndex;
	public activeSlide;

	public timeout: Timeout | null;
	public pausedTimeout: Timeout | null;
	public paused: boolean;

	public thumbs: HTMLElement[] | null;
	public activeThumb: HTMLElement | null;

	constructor(container: Element, slides: Element[], controls: Element, timer: number = 5000) {
		this.container = container;
		this.slides = slides;
		this.controls = controls;
		this.timer = timer;

		const activeSlide = localStorage.getItem('active-slide')
			? Number(localStorage.getItem('active-slide'))
			: 0;

		this.activeIndex = activeSlide;
		this.activeSlide = this.slides[this.activeIndex];

		this.timeout = null;
		this.pausedTimeout = null;
		this.paused = false;

		this.thumbs = null;
		this.activeThumb = null;

		this.init();
	}

	private init() {
		this.addControls();
		this.addThumbs();
		this.show(this.activeIndex);
	}

	public auto(timer: number) {
		this.timeout?.clear();
		this.timeout = new Timeout(() => this.next(), timer);

		if (this.activeThumb) this.activeThumb.style.setProperty('--animation-duration', `${timer}ms`);
	}

	public autoVideo(video: HTMLVideoElement) {
		video.muted = true;

		video.load();
		video.play();

		let firstPlay = true;
		video.addEventListener('playing', () => {
			if (firstPlay) this.auto(video.duration * 1000);
			firstPlay = false;
		});
	}

	public pause() {
		document.body.classList.add('pause');

		this.pausedTimeout = new Timeout(() => {
			this.timeout?.pause();
			this.paused = true;
			if (this.activeSlide instanceof HTMLVideoElement) this.activeSlide.pause();
			if (this.activeThumb) this.activeThumb.classList.add('slide__thumb--paused');
		}, 150);
	}

	public continue() {
		document.body.classList.remove('pause');

		this.pausedTimeout?.clear();
		if (!this.paused) return;

		this.paused = false;
		this.timeout?.continue();
		if (this.activeSlide instanceof HTMLVideoElement) this.activeSlide.play();
		if (this.activeThumb) this.activeThumb.classList.remove('slide__thumb--paused');
	}

	public prev() {
		if (this.paused) return;

		const prev = this.activeIndex - 1;
		if (prev < 0) return;
		this.show(prev);
	}

	public next() {
		if (this.paused) return;

		const next = this.activeIndex + 1;
		if (next >= this.slides.length) return;
		this.show(next);
	}

	private addControls() {
		const prevButton = document.createElement('button');
		const nextButton = document.createElement('button');

		prevButton.innerText = 'Slide Anterior';
		nextButton.innerText = 'Próximo Slide';

		this.controls.appendChild(prevButton);
		this.controls.appendChild(nextButton);

		this.controls.addEventListener('pointerdown', () => this.pause());
		document.addEventListener('pointerup', () => this.continue());
		document.addEventListener('touchend', () => this.continue());

		prevButton.addEventListener('pointerup', () => this.prev());
		nextButton.addEventListener('pointerup', () => this.next());
	}

	private addThumbs() {
		const thumbEl = document.createElement('div');
		thumbEl.id = 'slide-thumb';
		thumbEl.classList.add('slide__thumbs');

		this.slides.forEach(() => {
			thumbEl.innerHTML += `
				<span class="slide__thumb thumb__outer">
					<span class="thumb__inner"></span>
				</span>
			`;
		});

		this.controls.appendChild(thumbEl);
		this.thumbs = Array.from(document.querySelectorAll('.slide__thumb'));
	}

	public hide(el: Element) {
		el.classList.remove('slide__element--active');
	}

	public show(index: number) {
		this.activeIndex = index;
		this.activeSlide = this.slides[index];

		localStorage.setItem('active-slide', String(this.activeIndex));

		if (this.thumbs) {
			this.activeThumb = this.thumbs[index];
			this.thumbs.forEach((thumb) => thumb.classList.remove('slide__thumb--active'));
			this.activeThumb.classList.add('slide__thumb--active');
		}

		this.slides.forEach((slide) => this.hide(slide));
		this.activeSlide.classList.add('slide__element--active');

		if (this.activeSlide instanceof HTMLVideoElement) {
			this.autoVideo(this.activeSlide);
			return;
		}

		this.auto(this.timer);
	}
}
