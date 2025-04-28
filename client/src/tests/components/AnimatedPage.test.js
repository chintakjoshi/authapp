import React from 'react';
import { render, screen } from '@testing-library/react';
import AnimatedPage from '../../components/AnimatedPage';

describe('components/AnimatedPage.js', () => {
    it('applies animation classes properly', () => {
        const { container } = render(<AnimatedPage>Test Content</AnimatedPage>);

        const wrapperDiv = container.firstChild;
        expect(wrapperDiv).toHaveClass('animate-fade-in');
        expect(wrapperDiv).toHaveClass('opacity-0');
        expect(wrapperDiv).toHaveClass('animate-[fade-in_0.4s_ease-out_forwards]');
    });

    it('renders children correctly', () => {
        render(
            <AnimatedPage>
                <div>Child Element</div>
            </AnimatedPage>
        );

        expect(screen.getByText('Child Element')).toBeInTheDocument();
    });
});