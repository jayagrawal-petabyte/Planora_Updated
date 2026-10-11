import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

describe('Basic Test', () => {
  it('renders successfully', () => {
    render(<div>sign in to your account</div>);
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
  });
});
