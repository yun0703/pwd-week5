import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { restaurantAPI, submissionAPI } from '../services/api';
import type { Submission } from '../types';

const Container = styled.section`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
`;
const Card = styled.article`
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e3e5eb;
  border-radius: 8px;
`;
const Button = styled.button`
  margin: 0.5rem 0.5rem 0.5rem 0;
  padding: 0.6rem 0.9rem;
  border: 0;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: wait; }
`;

function SubmissionsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => submissionAPI.listSubmissions(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['submissions'] });
  const approve = useMutation({
    mutationFn: async (submission: Submission) => {
      await restaurantAPI.createRestaurant({
        name: submission.restaurantName,
        category: submission.category,
        location: submission.location,
        priceRange: submission.priceRange,
        description: submission.review,
        recommendedMenu: submission.recommendedMenu,
      });
      await submissionAPI.updateSubmission(submission.id, { status: 'approved' });
    },
    onSuccess: async () => {
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      await queryClient.invalidateQueries({ queryKey: ['popular-restaurants'] });
      toast.success('제보를 승인하고 Render에 맛집을 등록했습니다.');
    },
    onError: (cause: Error) => toast.error(cause.message),
  });
  const reject = useMutation({
    mutationFn: (submission: Submission) => submissionAPI.updateSubmission(submission.id, { status: 'rejected' }),
    onSuccess: async () => { await refresh(); toast.success('제보를 반려했습니다.'); },
    onError: (cause: Error) => toast.error(cause.message),
  });

  return (
    <Container>
      <h2>맛집 제보 관리</h2>
      <p>제보 내용은 이 브라우저의 LocalStorage에 저장됩니다. 승인하면 맛집이 백엔드에 등록됩니다.</p>
      <p><Link to="/admin">관리자 페이지로 돌아가기</Link></p>
      {isLoading && <p>제보를 불러오는 중…</p>}
      {error && <p role="alert">제보를 불러오지 못했습니다: {error.message}</p>}
      {!isLoading && !error && data?.data.length === 0 && <p>등록된 제보가 없습니다.</p>}
      {data?.data.map((submission) => (
        <Card key={submission.id}>
          <h3>{submission.restaurantName} <small>({submission.status})</small></h3>
          <p>{submission.category} · {submission.location}</p>
          {submission.priceRange && <p>가격대: {submission.priceRange}</p>}
          {submission.recommendedMenu?.length ? <p>추천 메뉴: {submission.recommendedMenu.join(', ')}</p> : null}
          {submission.review && <p>{submission.review}</p>}
          {submission.submitterName && <p>제보자: {submission.submitterName}</p>}
          {submission.status === 'pending' && <>
            <Button disabled={approve.isPending || reject.isPending} onClick={() => approve.mutate(submission)}>승인 후 등록</Button>
            <Button disabled={approve.isPending || reject.isPending} onClick={() => reject.mutate(submission)}>반려</Button>
          </>}
        </Card>
      ))}
    </Container>
  );
}

export default SubmissionsPage;
