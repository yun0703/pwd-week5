import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import styled from '@emotion/styled';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { restaurantAPI } from '../services/api';
import type { CreateRestaurantInput, Restaurant } from '../types';

type FormValues = {
  name: string;
  category: string;
  location: string;
  priceRange: string;
  rating: string;
  description: string;
  recommendedMenu: string;
  image: string;
};

const Container = styled.section`
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
`;
const Field = styled.label`
  display: block;
  margin: 1rem 0;
  font-weight: 600;
  input, select, textarea {
    box-sizing: border-box;
    display: block;
    width: 100%;
    margin-top: 0.4rem;
    padding: 0.7rem;
    border: 1px solid #ccd0da;
    border-radius: 6px;
    font: inherit;
  }
`;
const Button = styled.button`
  margin: 0.5rem 0.5rem 0.5rem 0;
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: wait; }
`;
const Danger = styled(Button)`
  background: #d64545;
`;
const RestaurantRow = styled.article`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e3e5eb;
  @media (max-width: 600px) { align-items: flex-start; flex-direction: column; }
`;

function AdminPage() {
  const queryClient = useQueryClient();
  const { data: restaurantsData, isLoading, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: restaurantAPI.getRestaurants,
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  const onEdit = (restaurant: Restaurant) => {
    toast.info(`${restaurant.name}: 이번 주 서버는 맛집 수정 API를 제공하지 않습니다.`);
  };
  const onDelete = (restaurant: Restaurant) => {
    toast.info(`${restaurant.name}: 이번 주 서버는 맛집 삭제 API를 제공하지 않습니다.`);
  };
  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateRestaurantInput = {
        name: values.name.trim(),
        category: values.category,
        location: values.location.trim(),
        priceRange: values.priceRange.trim() || undefined,
        rating: values.rating ? Number(values.rating) : undefined,
        description: values.description.trim() || undefined,
        recommendedMenu: values.recommendedMenu.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
        image: values.image.trim() || undefined,
      };
      return restaurantAPI.createRestaurant(payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['restaurants'] }),
        queryClient.invalidateQueries({ queryKey: ['popular-restaurants'] }),
      ]);
      toast.success('백엔드에 맛집을 등록했습니다.');
      reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Container>
      <h2>관리자: 맛집 등록</h2>
      <p>새 맛집은 Render 백엔드에 저장됩니다. 이번 주 API는 수정·삭제를 지원하지 않습니다.</p>
      <form onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
        <Field>맛집 이름 *<input {...register('name', { required: '이름을 입력해주세요.' })} /></Field>
        {errors.name && <p role="alert">{errors.name.message}</p>}
        <Field>카테고리 *
          <select defaultValue="" {...register('category', { required: '카테고리를 선택해주세요.' })}>
            <option value="" disabled>선택하세요</option>
            {['한식', '중식', '일식', '양식', '아시안', '분식', '카페', '기타'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        {errors.category && <p role="alert">{errors.category.message}</p>}
        <Field>위치 *<input {...register('location', { required: '위치를 입력해주세요.' })} /></Field>
        {errors.location && <p role="alert">{errors.location.message}</p>}
        <Field>가격대<input placeholder="예: 8,000-12,000원" {...register('priceRange')} /></Field>
        <Field>평점<input type="number" min="0" max="5" step="0.01" {...register('rating')} /></Field>
        <Field>소개<textarea rows={3} {...register('description')} /></Field>
        <Field>추천 메뉴 (쉼표 또는 줄바꿈으로 구분)<textarea rows={3} {...register('recommendedMenu')} /></Field>
        <Field>이미지 URL<input type="url" {...register('image')} /></Field>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? '등록 중…' : '맛집 등록'}
        </Button>
      </form>
      <h2>등록된 맛집</h2>
      {isLoading && <p>맛집 목록을 불러오는 중…</p>}
      {error && <p role="alert">맛집 목록을 불러오지 못했습니다: {error.message}</p>}
      {restaurantsData?.data.map((restaurant) => (
        <RestaurantRow key={restaurant.id}>
          <div>
            <strong>{restaurant.name}</strong>
            <div>{restaurant.category} · {restaurant.location}</div>
          </div>
          <div>
            <Button disabled title="이번 주 서버는 수정 API를 제공하지 않습니다." onClick={() => onEdit(restaurant)}>수정</Button>
            <Danger disabled title="이번 주 서버는 삭제 API를 제공하지 않습니다." onClick={() => onDelete(restaurant)}>삭제</Danger>
          </div>
        </RestaurantRow>
      ))}
      <p><Link to="/submissions">제보 목록 검토하기</Link></p>
    </Container>
  );
}

export default AdminPage;
