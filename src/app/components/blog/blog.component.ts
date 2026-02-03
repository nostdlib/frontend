import Prism from '../../../../src/main';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownModule, MarkdownService } from 'ngx-markdown';

@Component({
	selector: 'app-blog',
	imports: [MarkdownModule, CommonModule],
	providers: [MarkdownService],
	templateUrl: './blog.component.html',
	styleUrl: './blog.component.scss'
})
export class BlogComponent {

	public post: string = '';

	constructor(
		private router: Router,
		private route: ActivatedRoute,
	) {
		this.route.paramMap.subscribe(params => {
			this.post = params.get('post') || '';
		});
	}

	ngAfterViewInit() {
		Prism.highlightAll(true, () => {
			console.log('highlighted!');
		});
	}

	onMarkdownClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const anchor = target.closest('a') as HTMLAnchorElement | null;
		if (!anchor) return;
		const href = anchor.getAttribute('href');
		if (href?.startsWith('#')) {
			// const id = href.slice(1);
			// document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
			// history.pushState(null, '', href);
			return;
		}
		
		if (!href) return;
		if (
		  anchor.target === '_blank' ||
		  href.startsWith('http') ||
		  href.startsWith('mailto:')
		) {
		  return;
		}
	
		event.preventDefault();
		this.router.navigate([href]);
	}
}
